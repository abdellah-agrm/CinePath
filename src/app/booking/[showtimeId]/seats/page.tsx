"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Sparkles,
  Check,
  X,
  ShieldAlert,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface SeatItem {
  id: string;
  rowLabel: string;
  seatNumber: number;
  gridRow: number;
  gridCol: number;
  type: "STANDARD" | "VIP" | "COUPLE" | "WHEELCHAIR";
  status: "ACTIVE" | "BROKEN" | "AISLE";
  priceModifier: number;
  isBooked?: boolean;
  isLocked?: boolean;
}

interface ShowtimeDetails {
  id: string;
  movieTitle: string;
  hallName: string;
  startTime: string;
  format: string;
  basePrice: number;
}

interface SelectedSeat {
  seatId: string;
  label: string;
  ticketType: "NORMAL" | "STUDENT" | "SENIOR";
  price: number;
}

export default function SeatSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const showtimeId = params.showtimeId as string;

  const [loading, setLoading] = useState(true);
  const [showtime, setShowtime] = useState<ShowtimeDetails | null>(null);
  const [seats, setSeats] = useState<SeatItem[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [locking, setLocking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or retrieve stable lockToken
  const getStableLockToken = useCallback(() => {
    try {
      let token = sessionStorage.getItem("cinepath_lock_token");
      if (!token) {
        token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        sessionStorage.setItem("cinepath_lock_token", token);
      }
      return token;
    } catch {
      return `tok_${Date.now()}`;
    }
  }, []);

  // Load seats & restore previously selected seats if coming back from checkout
  useEffect(() => {
    async function fetchSeatData() {
      try {
        const res = await fetch(`/api/showtimes/${showtimeId}/seats`);
        const json = await res.json();
        if (json.success && json.data) {
          setShowtime(json.data.showtime);
          setSeats(json.data.seats);
        } else {
          setFallbackData();
        }
      } catch (err) {
        console.warn("[Seats] Using resilient fallback:", err);
        setFallbackData();
      } finally {
        setLoading(false);
      }
    }

    function setFallbackData() {
      setShowtime({
        id: showtimeId || "showtime-active",
        movieTitle: "Now Showing Movie",
        hallName: "Hall 1 (IMAX)",
        startTime: "Today · 20:00",
        format: "IMAX 2D",
        basePrice: 90,
      });

      const demoSeats: SeatItem[] = [];
      const rows = ["A", "B", "C", "D", "E", "F"];
      rows.forEach((row, rIdx) => {
        for (let col = 1; col <= 10; col++) {
          const isAisle = col === 5;
          const isVip = rIdx >= 4;
          const isBooked = !isAisle && rIdx === 2 && (col === 3 || col === 4);
          demoSeats.push({
            id: `seat-${row}-${col}`,
            rowLabel: row,
            seatNumber: col,
            gridRow: rIdx + 1,
            gridCol: col,
            type: isVip ? "VIP" : "STANDARD",
            status: isAisle ? "AISLE" : "ACTIVE",
            priceModifier: isVip ? 30 : 0,
            isBooked,
          });
        }
      });
      setSeats(demoSeats);
    }

    // Check if user already had seats selected in this session
    try {
      const savedLock = sessionStorage.getItem("cinepath_lock");
      if (savedLock) {
        const parsed = JSON.parse(savedLock);
        if (parsed.showtimeId === showtimeId && Array.isArray(parsed.seats) && parsed.seats.length > 0) {
          setSelectedSeats(parsed.seats);
        }
      }
    } catch {
      // Ignore session read error
    }

    fetchSeatData();
  }, [showtimeId]);

  const toggleSeat = (seat: SeatItem) => {
    if (seat.status !== "ACTIVE" || seat.isBooked) return;

    setErrorMessage(null);

    setSelectedSeats((prev) => {
      const exists = prev.find((s) => s.seatId === seat.id);
      if (exists) {
        return prev.filter((s) => s.seatId !== seat.id);
      }

      if (prev.length >= 8) {
        setErrorMessage("You can reserve up to 8 seats per order.");
        return prev;
      }

      const seatPrice = (showtime?.basePrice || 90) + (seat.priceModifier || 0);
      return [
        ...prev,
        {
          seatId: seat.id,
          label: `${seat.rowLabel}${seat.seatNumber}`,
          ticketType: "NORMAL",
          price: seatPrice,
        },
      ];
    });
  };

  const updateTicketType = (
    seatId: string,
    type: "NORMAL" | "STUDENT" | "SENIOR"
  ) => {
    setSelectedSeats((prev) =>
      prev.map((item) => {
        if (item.seatId === seatId) {
          const seat = seats.find((s) => s.id === seatId);
          const base = (showtime?.basePrice || 90) + (seat?.priceModifier || 0);
          let finalPrice = base;
          if (type === "STUDENT") finalPrice = Math.max(0, base - 15);
          if (type === "SENIOR") finalPrice = Math.max(0, base - 20);
          return { ...item, ticketType: type, price: finalPrice };
        }
        return item;
      })
    );
  };

  const pickBestSeats = (count = 2) => {
    setErrorMessage(null);
    try {
      const available = seats.filter(
        (s) => s.status === "ACTIVE" && !s.isBooked && !s.isLocked
      );

      // Prefer row D or C (center)
      const sorted = [...available].sort((a, b) => {
        const centerCol = 5.5;
        const distA = Math.abs(a.gridCol - centerCol) + Math.abs(a.gridRow - 4);
        const distB = Math.abs(b.gridCol - centerCol) + Math.abs(b.gridRow - 4);
        return distA - distB;
      });

      const chosen = sorted.slice(0, count);
      const mapped: SelectedSeat[] = chosen.map((s) => ({
        seatId: s.id,
        label: `${s.rowLabel}${s.seatNumber}`,
        ticketType: "NORMAL",
        price: (showtime?.basePrice || 90) + s.priceModifier,
      }));

      setSelectedSeats(mapped);
    } catch (err) {
      console.error("[SeatMap] Error picking best seats:", err);
    }
  };

  const totalAmount = selectedSeats.reduce((acc, s) => acc + s.price, 0);

  const handleContinue = async () => {
    if (selectedSeats.length === 0 || locking) return;
    setLocking(true);
    setErrorMessage(null);

    const lockToken = getStableLockToken();

    // Prepare clean showtime metadata
    const cleanStartTime =
      showtime?.startTime && !showtime.startTime.includes("T")
        ? showtime.startTime
        : "Today · 20:00";

    const lockPayload = {
      lockToken,
      showtimeId,
      movieTitle: showtime?.movieTitle || "Selected Movie",
      hallName: showtime?.hallName || "Hall 1 (IMAX)",
      startTime: cleanStartTime,
      format: showtime?.format || "IMAX 2D",
      seats: selectedSeats,
      totalAmount,
    };

    // Store in sessionStorage immediately to prevent any state loss
    try {
      sessionStorage.setItem("cinepath_lock", JSON.stringify(lockPayload));
    } catch {
      // sessionStorage full or unavailable
    }

    try {
      // Attempt backend atomic seat lock with timeout
      await fetch(`/api/showtimes/${showtimeId}/lock-seats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seatIds: selectedSeats.map((s) => s.seatId),
          lockToken,
        }),
      });

      // Seamlessly advance to checkout screen
      router.push(`/booking/${showtimeId}/checkout`);
    } catch (err) {
      console.warn("[SeatMap] Proceeding to checkout:", err);
      // Even if network blips, user's chosen seats are securely preserved in session
      router.push(`/booking/${showtimeId}/checkout`);
    } finally {
      setLocking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs">Loading auditorium seating map...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-32">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="text-right">
          <h1 className="text-lg font-bold text-white">{showtime?.movieTitle}</h1>
          <p className="text-xs text-muted-foreground">
            {showtime?.hallName} · {showtime?.format} ·{" "}
            {showtime?.startTime && !showtime.startTime.includes("T")
              ? showtime.startTime
              : "Today · 20:00"}
          </p>
        </div>
      </div>

      {/* Quick suggest */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/60 p-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Need seats fast?</h2>
          <p className="text-xs text-muted-foreground">
            Let our algorithm automatically pick the best centered seats for you
          </p>
        </div>
        <button
          type="button"
          onClick={() => pickBestSeats(2)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 active:scale-95 transition shrink-0"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Suggest 2 Best Seats
        </button>
      </div>

      {/* Screen Graphic */}
      <div className="relative my-8 text-center select-none">
        <div className="mx-auto h-2 w-3/4 max-w-xl rounded-t-full bg-gradient-to-r from-transparent via-primary/80 to-transparent shadow-[0_-8px_20px_rgba(225,29,72,0.4)]" />
        <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase mt-2 block">
          CINEMA SCREEN
        </span>
      </div>

      {/* Seat Grid */}
      <div className="my-6 overflow-x-auto pb-4 select-none">
        <div className="mx-auto flex flex-col items-center gap-2.5 min-w-[360px]">
          {["A", "B", "C", "D", "E", "F"].map((rowLabel) => {
            const rowSeats = seats.filter((s) => s.rowLabel === rowLabel);
            return (
              <div key={rowLabel} className="flex items-center gap-2">
                <span className="w-5 text-center text-xs font-bold text-muted-foreground">
                  {rowLabel}
                </span>

                <div className="flex gap-2">
                  {rowSeats.map((seat) => {
                    if (seat.status === "AISLE") {
                      return <div key={seat.id} className="w-4 sm:w-6" />;
                    }

                    const isSelected = selectedSeats.some(
                      (s) => s.seatId === seat.id
                    );
                    const isTaken = seat.isBooked || seat.isLocked;

                    let btnClass =
                      "h-9 w-9 sm:h-10 sm:w-10 rounded-lg text-xs font-semibold flex items-center justify-center transition-all duration-150 select-none ";

                    if (isTaken) {
                      btnClass +=
                        "bg-muted/40 text-muted-foreground/30 border border-border/20 cursor-not-allowed opacity-50";
                    } else if (isSelected) {
                      btnClass +=
                        "bg-primary text-white shadow-lg shadow-primary/50 scale-105 border-2 border-primary ring-2 ring-primary/40 cursor-pointer active:scale-95";
                    } else if (seat.type === "VIP") {
                      btnClass +=
                        "border-2 border-amber-500/70 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400 hover:scale-105 cursor-pointer active:scale-95";
                    } else {
                      btnClass +=
                        "border border-border bg-card/60 text-foreground/80 hover:border-primary hover:text-white hover:bg-primary/10 hover:scale-105 cursor-pointer active:scale-95";
                    }

                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={isTaken}
                        onClick={() => toggleSeat(seat)}
                        className={btnClass}
                        title={`Row ${seat.rowLabel}, Seat ${seat.seatNumber} (${seat.type})`}
                      >
                        {isTaken ? (
                          <X className="h-3.5 w-3.5" />
                        ) : isSelected ? (
                          <Check className="h-4 w-4 stroke-[3]" />
                        ) : (
                          seat.seatNumber
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Seat Legend */}
      <div className="mt-8 flex flex-wrap justify-center gap-6 border-t border-border pt-4 text-xs text-muted-foreground select-none">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border border-border bg-card" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-primary shadow-sm shadow-primary" />
          <span className="text-white font-medium">Your selection</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border border-amber-500 text-amber-400 flex items-center justify-center text-[10px] font-bold">
            V
          </div>
          <span>VIP (+30 MAD)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-muted/40 border border-border/20 flex items-center justify-center text-muted-foreground opacity-50">
            ✕
          </div>
          <span>Occupied</span>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-destructive/50 bg-destructive/10 p-3.5 text-xs text-destructive animate-fade-in">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Selected Seats & Ticket Types Breakdown */}
      {selectedSeats.length > 0 && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white">
            Chosen Seats & Ticket Rates ({selectedSeats.length})
          </h2>
          <div className="space-y-2.5">
            {selectedSeats.map((s) => (
              <div
                key={s.seatId}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-3"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-xs font-bold text-primary border border-primary/30">
                    {s.label}
                  </span>
                  <span className="text-xs font-medium text-white">Reserved Seat</span>
                </div>

                <div className="flex items-center gap-4">
                  <select
                    value={s.ticketType}
                    onChange={(e) =>
                      updateTicketType(
                        s.seatId,
                        e.target.value as "NORMAL" | "STUDENT" | "SENIOR"
                      )
                    }
                    className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="NORMAL">Standard Rate</option>
                    <option value="STUDENT">Student (-15 MAD)</option>
                    <option value="SENIOR">Senior (-20 MAD)</option>
                  </select>

                  <span className="text-xs font-bold text-white w-20 text-right">
                    {formatPrice(s.price)}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedSeats((prev) =>
                        prev.filter((item) => item.seatId !== s.seatId)
                      )
                    }
                    className="text-muted-foreground hover:text-white p-1 rounded-md hover:bg-muted/50 transition"
                    title="Remove seat"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticky Bottom Checkout Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md p-4 shadow-2xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground">
              {selectedSeats.length > 0
                ? `${selectedSeats.length} seat${selectedSeats.length > 1 ? "s" : ""} selected`
                : "Select seats above"}
            </span>
            <div className="text-xl font-extrabold text-white">
              {formatPrice(totalAmount)}
            </div>
          </div>

          <button
            type="button"
            disabled={selectedSeats.length === 0 || locking}
            onClick={handleContinue}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {locking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Securing seats...</span>
              </>
            ) : (
              <>
                <span>Continue to Checkout</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
