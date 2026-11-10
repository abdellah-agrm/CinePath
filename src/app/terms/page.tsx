import Link from "next/link";
import { ArrowLeft, ShieldAlert, Clock, RefreshCw } from "lucide-react";

export default function TermsOfSalePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 pb-24">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <h1 className="text-3xl font-extrabold text-white tracking-tight">
        Terms of Sale & Ticket Policies
      </h1>
      <p className="text-xs text-muted-foreground mt-1">
        Last updated: November 2026 · CinePath Platform
      </p>

      <div className="mt-8 space-y-8 text-sm text-muted-foreground leading-relaxed">
        <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            1. 10-Minute Seat Hold Reservation Rule
          </h2>
          <p>
            When you select seats and proceed to checkout, CinePath atomically locks those
            seats in our Redis memory cache for exactly <strong>10 minutes</strong>. During this window, no other customer can book or view those seats as available.
          </p>
          <p>
            If payment is not completed before the countdown timer hits 00:00, your temporary lock expires, the seats are returned to the public seating map, and your checkout session terminates.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-emerald-400" />
            2. Late Payment & Automatic Refund Protection
          </h2>
          <p>
            In the rare event that a bank authentication delay (3D Secure) causes payment to succeed after your 10-minute hold has elapsed, our database safety net prevents double-booking.
          </p>
          <p>
            If another moviegoer booked your seats before your payment finalized, our system will <strong>automatically trigger a full refund via Stripe</strong> within minutes and send you a notification email.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            3. Digital QR Ticket Admission
          </h2>
          <p>
            Every digital ticket includes a cryptographically signed HMAC token. Admission is granted upon scanning by cinema gate personnel. Each QR code is valid for exactly one entry and is marked as USED upon first scan.
          </p>
        </section>
      </div>
    </div>
  );
}

