"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  CreditCard,
  Lock,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

interface BookingSession {
  showtimeId: string;
  lockToken: string;
  movieTitle?: string;
  hallName?: string;
  startTime?: string;
  format?: string;
  seats: Array<{ seatId: string; label: string; ticketType: string; price: number }>;
  totalAmount: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [email, setEmail] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [bookingData, setBookingData] = useState<BookingSession | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form input state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }

    try {
      const raw = sessionStorage.getItem("cinepath_lock");
      if (raw) {
        setBookingData(JSON.parse(raw));
      } else {
        // Fallback session if opened directly
        setBookingData({
          showtimeId: "showtime-active",
          lockToken: "tok_fallback",
          movieTitle: "Now Showing Feature",
          hallName: "Hall 1 (IMAX)",
          startTime: "Today · 20:00",
          format: "IMAX 2D",
          seats: [
            { seatId: "seat-C-5", label: "C5", ticketType: "NORMAL", price: 90 },
            { seatId: "seat-C-6", label: "C6", ticketType: "NORMAL", price: 90 },
          ],
          totalAmount: 180,
        });
      }
    } catch (e) {
      console.warn("Failed to parse lock session", e);
    }

    // 10-minute timer countdown
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isTimerExpiring = timeLeft < 120;

  // Format Card Number with automatic spacing (XXXX XXXX XXXX XXXX)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = rawVal.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  // Format Expiry with automatic slash (MM / YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (rawVal.length >= 3) {
      setCardExpiry(`${rawVal.slice(0, 2)} / ${rawVal.slice(2)}`);
    } else {
      setCardExpiry(rawVal);
    }
  };

  // Quick 1-click test card filler
  const handleAutofillTestCard = () => {
    setCardNumber("4242 4242 4242 4242");
    setCardExpiry("12 / 28");
    setCardCvc("888");
    if (!email) {
      setEmail(user?.email || "customer@example.com");
    }
    setValidationError(null);
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === "CINEMA10") {
      setPromoApplied(true);
      setValidationError(null);
    } else {
      setValidationError("Invalid promo code. Try 'CINEMA10' for 10% off!");
    }
  };

  const finalAmount = promoApplied && bookingData
    ? bookingData.totalAmount * 0.9
    : bookingData?.totalAmount || 90;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!email || !email.includes("@")) {
      setValidationError("Please enter a valid email address for your e-ticket.");
      return;
    }

    if (cardNumber.replace(/\s/g, "").length < 15) {
      setValidationError("Please enter a complete 16-digit card number (or click 'Autofill Test Card').");
      return;
    }

    setProcessing(true);

    setTimeout(() => {
      try {
        const bookingRef = `CP-${Math.floor(10000 + Math.random() * 90000)}`;

        const confirmedBooking = {
          id: bookingRef,
          reference: bookingRef,
          movieTitle: bookingData?.movieTitle || "Now Showing Feature",
          hall: bookingData?.hallName || "Hall 1 (IMAX)",
          cinema: "CinePath Anfa Multiplex",
          time: bookingData?.startTime || "Today · 20:00",
          format: `${bookingData?.format || "IMAX 2D"} · VOSTFR`,
          seats:
            bookingData?.seats && bookingData.seats.length > 0
              ? bookingData.seats.map((s) => `Seat ${s.label} (${s.ticketType})`)
              : ["Seat A8 (Normal)"],
          seatLabels:
            bookingData?.seats && bookingData.seats.length > 0
              ? bookingData.seats.map((s) => s.label)
              : ["A8"],
          totalAmount: finalAmount,
          status: "UPCOMING",
          paidAt: new Date().toISOString(),
          customerEmail: email,
        };

        // Persist booking in localStorage for ticket page & history
        localStorage.setItem(`cinepath_booking_${bookingRef}`, JSON.stringify(confirmedBooking));

        try {
          const existingRaw = localStorage.getItem("cinepath_user_tickets");
          const existingList = existingRaw ? JSON.parse(existingRaw) : [];
          localStorage.setItem(
            "cinepath_user_tickets",
            JSON.stringify([confirmedBooking, ...existingList])
          );
        } catch {
          // localStorage full or private mode
        }

        router.push(`/tickets/${bookingRef}`);
      } catch (err) {
        console.error("[Checkout] Error finalizing booking:", err);
        setProcessing(false);
      }
    }, 800);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border pb-4 mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Change Seats
        </button>

        {/* 10-Minute Hold Countdown Timer */}
        <div
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold border transition ${
            isTimerExpiring
              ? "bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse"
              : "bg-card border-border text-foreground"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>
            Seats held for {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      {validationError && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-destructive/50 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Email & Payment Form */}
        <div className="md:col-span-7 space-y-6">
          <form onSubmit={handlePayment} className="space-y-6">
            {/* Step 1: Customer Email */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold text-white mb-1">
                1. Your Digital Ticket Delivery
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Where should we send your HMAC signed QR admission ticket?
              </p>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setValidationError(null);
                  }}
                  className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm text-white placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                />
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  {user ? "Verified CinePath account." : "No password required. Digital tickets will be instantly issued."}
                </p>
              </div>
            </div>

            {/* Step 2: Payment Details */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-white">2. Payment Details</h2>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <Lock className="h-3 w-3" />
                    <span>256-bit Encrypted</span>
                  </div>
                </div>

                {/* 1-Click Autofill Helper */}
                <button
                  type="button"
                  onClick={handleAutofillTestCard}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 active:scale-95 transition"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Autofill Test Card</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="4532 •••• •••• ••••"
                      maxLength={19}
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full rounded-xl border border-border bg-background/50 pl-10 pr-4 py-2.5 text-sm text-white font-mono placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                    />
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                      Expires (MM / YY)
                    </label>
                    <input
                      type="text"
                      placeholder="12 / 28"
                      maxLength={7}
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm text-white font-mono placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                      CVC
                    </label>
                    <input
                      type="password"
                      placeholder="•••"
                      maxLength={4}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ""))}
                      className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm text-white font-mono placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-border pt-4">
                <p className="text-[11px] text-muted-foreground mb-4">
                  By clicking Pay, you agree to the CinePath Terms of Sale and Ticket Policies.
                </p>

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-95 disabled:opacity-50 transition cursor-pointer"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Securing tickets & charging...</span>
                    </>
                  ) : (
                    <span>Pay {formatPrice(finalAmount)}</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Order Summary */}
        <div className="md:col-span-5">
          <div className="sticky top-20 rounded-2xl border border-border bg-card p-6 space-y-4">
            <h3 className="font-semibold text-white border-b border-border pb-3">
              Order Summary
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Movie</span>
                <span className="font-semibold text-white text-right max-w-[200px] truncate">
                  {bookingData?.movieTitle || "Selected Movie"}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Format & Language</span>
                <span className="font-semibold text-white">
                  {bookingData?.format || "IMAX 2D"} · VOSTFR
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Hall</span>
                <span className="font-semibold text-white">
                  {bookingData?.hallName || "Hall 1 (IMAX)"}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Showtime</span>
                <span className="font-semibold text-white">
                  {bookingData?.startTime || "Today · 20:00"}
                </span>
              </div>
            </div>

            {/* Seats Breakdown */}
            <div className="border-t border-border pt-3 space-y-1.5 text-xs">
              {bookingData?.seats && bookingData.seats.length > 0 ? (
                bookingData.seats.map((s) => (
                  <div key={s.seatId} className="flex justify-between">
                    <span className="text-muted-foreground">
                      Seat {s.label} ({s.ticketType})
                    </span>
                    <span className="font-medium text-white">{formatPrice(s.price)}</span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seat A8 (Normal)</span>
                  <span className="font-medium text-white">90.00 MAD</span>
                </div>
              )}
            </div>

            {/* Promo code box */}
            <div className="border-t border-border pt-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="PROMO CODE (CINEMA10)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 pl-8 text-xs text-white uppercase placeholder-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted active:scale-95 transition"
                >
                  Apply
                </button>
              </div>

              {promoApplied && (
                <div className="mt-2 flex items-center justify-between text-xs text-emerald-400 font-medium">
                  <span>10% Promo Discount Applied</span>
                  <span>-10%</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="border-t border-border pt-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Total due</span>
              <span className="text-xl font-extrabold text-primary">
                {formatPrice(finalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
