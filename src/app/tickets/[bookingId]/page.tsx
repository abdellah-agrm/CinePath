"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle,
  Download,
  Calendar,
  MapPin,
  Clock,
  Film,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { generateTicketHmac } from "@/lib/hmac";

interface BookingDetail {
  id: string;
  reference: string;
  movieTitle: string;
  hall: string;
  cinema: string;
  time: string;
  format: string;
  seats: string[];
  seatLabels: string[];
  totalAmount: number;
}

export default function TicketConfirmationPage() {
  const params = useParams();
  const bookingRef = (params.bookingId as string) || "CP-94812";

  const [booking, setBooking] = useState<BookingDetail>({
    id: bookingRef,
    reference: bookingRef,
    movieTitle: "Now Showing Feature",
    hall: "Hall 1 (IMAX)",
    cinema: "CinePath Anfa Multiplex",
    time: "Today · 20:00",
    format: "IMAX 2D · VOSTFR",
    seats: ["Seat A8 (Normal)"],
    seatLabels: ["A8"],
    totalAmount: 90,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`cinepath_booking_${bookingRef}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setBooking(parsed);
      } else {
        // Check if there is an item in user's ticket list
        const listRaw = localStorage.getItem("cinepath_user_tickets");
        if (listRaw) {
          const list = JSON.parse(listRaw);
          const found = list.find((b: any) => b.reference === bookingRef || b.id === bookingRef);
          if (found) setBooking(found);
        }
      }
    } catch (e) {
      console.warn("Could not load booking from storage:", e);
    }
  }, [bookingRef]);

  // HMAC Signed QR Payload for gate validation
  const qrPayload = JSON.stringify({
    ref: booking.reference,
    movie: booking.movieTitle,
    hall: booking.hall,
    time: booking.time,
    seats: booking.seatLabels,
    sig: generateTicketHmac(booking.id, "showtime-active", booking.reference),
  });

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleAddToCalendar = () => {
    alert(`Calendar reminder added for ${booking.movieTitle} (${booking.time})!`);
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-12 pb-24 text-center print:py-0 print:max-w-md">
      {/* Print Specific CSS to completely hide Navbars, Footers and prevent overlapping */}
      <style jsx global>{`
        @media print {
          header,
          nav,
          footer,
          .no-print,
          button,
          a {
            display: none !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .ticket-card {
            box-shadow: none !important;
            border: 2px solid #e2e8f0 !important;
            background-color: #ffffff !important;
            color: #0f172a !important;
            page-break-inside: avoid !important;
            margin: 20px auto !important;
          }
          .ticket-card * {
            color: #0f172a !important;
          }
          .print-badge {
            background-color: #f1f5f9 !important;
            border: 1px solid #cbd5e1 !important;
          }
        }
      `}</style>

      {/* Success Banner */}
      <div className="no-print">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-4 ring-8 ring-emerald-500/5">
          <CheckCircle className="h-10 w-10" />
        </div>

        <h1 className="text-2xl font-bold text-white">You&apos;re All Set!</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your booking has been confirmed and tickets are ready.
        </p>
      </div>

      {/* Printable Ticket Card */}
      <div className="ticket-card mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-2xl text-left">
        {/* Ticket Header */}
        <div className="bg-primary/10 border-b border-border/80 p-5 flex items-center justify-between print-badge">
          <div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
              E-Ticket (Verified)
            </span>
            <div className="text-sm font-semibold text-white">
              Booking #{booking.reference}
            </div>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="h-3.5 w-3.5" />
            Active
          </span>
        </div>

        {/* QR Code Presentation */}
        <div className="flex flex-col items-center justify-center bg-white p-6">
          <div className="rounded-xl p-2 bg-white shadow-inner">
            <QRCodeSVG value={qrPayload} size={180} level="H" />
          </div>
          <p className="mt-3 text-[11px] font-mono text-zinc-600">
            Scan at {booking.hall} Entrance
          </p>
        </div>

        {/* Perforated Divider */}
        <div className="relative flex items-center justify-between border-t border-dashed border-border px-4 py-1 bg-card">
          <div className="h-4 w-4 -ml-6 rounded-full bg-background border border-border" />
          <div className="h-4 w-4 -mr-6 rounded-full bg-background border border-border" />
        </div>

        {/* Ticket Details */}
        <div className="p-6 space-y-4">
          <div>
            <span className="text-xs font-medium text-muted-foreground">Film</span>
            <h2 className="text-xl font-bold text-white">{booking.movieTitle}</h2>
            <p className="text-xs text-primary font-medium">{booking.format}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs border-t border-border/60 pt-4">
            <div>
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Date & Time
              </span>
              <p className="font-semibold text-white mt-1">{booking.time}</p>
            </div>
            <div>
              <span className="text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Cinema & Hall
              </span>
              <p className="font-semibold text-white mt-1">{booking.cinema} · {booking.hall}</p>
            </div>
          </div>

          {/* Reserved Seats List */}
          <div className="border-t border-border/60 pt-4">
            <span className="text-xs text-muted-foreground">Seats</span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {booking.seats.map((seatStr, idx) => (
                <span
                  key={idx}
                  className="rounded-lg bg-primary/20 px-3 py-1 text-xs font-bold text-primary border border-primary/30"
                >
                  {seatStr}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons (Save as PDF / Add to Calendar) */}
      <div className="no-print mt-6 flex flex-wrap justify-center gap-3">
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition"
        >
          <Download className="h-3.5 w-3.5" />
          Save as PDF
        </button>
        <button
          onClick={handleAddToCalendar}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition"
        >
          <Calendar className="h-3.5 w-3.5" />
          Add to Calendar
        </button>
      </div>

      {/* Guest conversion banner */}
      <div className="no-print mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-left">
        <h3 className="text-xs font-bold text-white">Save your tickets for later?</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Create a password to turn your booking into a permanent CinePath account.
        </p>
        <Link
          href="/register"
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Create account <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
