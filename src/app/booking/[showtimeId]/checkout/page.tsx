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
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes (600s)
  const [email, setEmail] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [bookingData, setBookingData] = useState<{
    showtimeId: string;
    lockToken: string;
    seats: Array<{ seatId: string; label: string; ticketType: string; price: number }>;
    totalAmount: number;
  } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("cinepath_lock");
    if (raw) {
      try {
        setBookingData(JSON.parse(raw));
      } catch (e) {
        console.error("Failed to parse lock session", e);
      }
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
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isTimerExpiring = timeLeft < 120; // 2 minutes left warning

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === "CINEMA10") {
      setPromoApplied(true);
    } else {
      alert("Invalid promo code. Try 'CINEMA10' for 10% off!");
    }
  };

  const finalAmount = promoApplied && bookingData
    ? bookingData.totalAmount * 0.9
    : bookingData?.totalAmount || 0;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert("Please provide an email address for your digital tickets.");
      return;
    }

    setProcessing(true);

    // Simulate payment intent confirmation and ticket generation
    setTimeout(() => {
      setProcessing(false);
      const bookingRef = `CP-${Math.floor(10000 + Math.random() * 90000)}`;
      sessionStorage.setItem("last_booking_ref", bookingRef);
      router.push(`/tickets/${bookingRef}`);
    }, 1500);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-24">
      {/* Top Header & Countdown */}
      <div className="flex items-center justify-between border-b border-border pb-4 mb-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Change Seats
        </button>

        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
            isTimerExpiring
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
              : "bg-muted text-foreground border border-border"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>
            Held for {minutes.toString().padStart(2, "0")}:
            {seconds.toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      {timeLeft === 0 ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-3" />
          <h2 className="text-xl font-bold text-white">Seat hold expired</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Your 10-minute hold has elapsed and your seats were released for other moviegoers.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-6 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
          >
            Pick Seats Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Guest Email & Payment Form */}
          <div className="md:col-span-7 space-y-6">
            <form onSubmit={handlePayment} className="space-y-6">
              {/* Guest / User Email */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-base font-semibold text-white mb-2">
                  1. Your Digital Ticket Delivery
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Where should we send your HMAC-signed QR ticket and receipt?
                </p>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    No account required. You will be able to save your tickets later.
                  </p>
                </div>
              </div>

              {/* Payment Info */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-white">
                    2. Payment Details
                  </h2>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3 text-emerald-500" />
                    256-bit SSL Encrypted
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="4242 •••• •••• 4242"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary pl-10"
                      />
                      <CreditCard className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Expires
                      </label>
                      <input
                        type="text"
                        placeholder="MM / YY"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        CVC
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                    className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 hover:bg-primary/90 disabled:opacity-50 transition"
                  >
                    {processing
                      ? "Securing tickets & charging..."
                      : `Pay ${formatPrice(finalAmount)}`}
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

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Movie</span>
                  <span className="font-semibold text-white">Dune: Part Two</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Format & Language</span>
                  <span className="font-semibold text-white">IMAX 2D · VOSTFR</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Hall</span>
                  <span className="font-semibold text-white">Hall 1 (IMAX)</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Showtime</span>
                  <span className="font-semibold text-white">Today · 20:00</span>
                </div>
              </div>

              {/* Seats Breakdown */}
              <div className="border-t border-border pt-3 space-y-1.5 text-xs">
                {bookingData?.seats.map((s) => (
                  <div key={s.seatId} className="flex justify-between">
                    <span className="text-muted-foreground">
                      Seat {s.label} ({s.ticketType})
                    </span>
                    <span className="font-medium text-white">{formatPrice(s.price)}</span>
                  </div>
                ))}
              </div>

              {/* Promo code box */}
              <div className="border-t border-border pt-3">
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Promo code (CINEMA10)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground uppercase focus:outline-none focus:ring-1 focus:ring-primary pl-8"
                    />
                    <Tag className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/80"
                  >
                    Apply
                  </button>
                </form>

                {promoApplied && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    10% discount applied!
                  </p>
                )}
              </div>

              {/* Total */}
              <div className="border-t border-border pt-3 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-white">Total due</span>
                <span className="text-xl font-extrabold text-primary">
                  {formatPrice(finalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

