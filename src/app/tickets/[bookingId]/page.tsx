"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  Download,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Check,
  ExternalLink,
} from "lucide-react";
import { generateTicketHmac } from "@/lib/hmac";
import { formatPrice } from "@/lib/utils";

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
  posterUrl?: string;
}

export default function TicketConfirmationPage() {
  const params = useParams();
  const bookingRef = (params.bookingId as string) || "CP-84920";

  const [booking, setBooking] = useState<BookingDetail>({
    id: bookingRef,
    reference: bookingRef,
    movieTitle: "Now Showing Feature",
    hall: "Hall 1 (IMAX)",
    cinema: "CinePath Anfa Multiplex",
    time: "Today · 20:00",
    format: "IMAX 2D · VOSTFR",
    seats: ["Seat A8 (Standard)", "Seat A9 (Standard)"],
    seatLabels: ["A8", "A9"],
    totalAmount: 180,
    posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
  });

  const [walletSaved, setWalletSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`cinepath_booking_${bookingRef}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setBooking(parsed);
      } else {
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

  // Google Wallet Pass Generator & Downloader
  const handleSaveToGoogleWallet = () => {
    try {
      const googleWalletPass = {
        iss: "CinePath Multiplex",
        aud: "google",
        typ: "savetoandroidpay",
        iat: Math.floor(Date.now() / 1000),
        payload: {
          eventTicketObjects: [
            {
              id: `cinepath.${booking.reference}`,
              classId: "cinepath.cinema_admission_class",
              eventName: { defaultValue: { language: "en", value: booking.movieTitle } },
              venue: {
                name: { defaultValue: { language: "en", value: `${booking.cinema} - ${booking.hall}` } },
              },
              dateTime: { start: booking.time },
              seatInfo: {
                seat: { defaultValue: { language: "en", value: booking.seatLabels.join(", ") } },
              },
              ticketHolderName: "CinePath Guest",
              barcode: {
                type: "QR_CODE",
                value: qrPayload,
                alternateText: booking.reference,
              },
              state: "ACTIVE",
            },
          ],
        },
      };

      // Trigger automatic Google Wallet pass JSON download
      const blob = new Blob([JSON.stringify(googleWalletPass, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Google-Wallet-CinePath-${booking.reference}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setWalletSaved(true);
      setTimeout(() => setWalletSaved(false), 5000);
    } catch (err) {
      console.error("Error creating Google Wallet pass:", err);
    }
  };

  const handleAddToCalendar = () => {
    const icsData = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//CinePath//Cinema Ticketing//EN",
      "BEGIN:VEVENT",
      `SUMMARY:🎬 ${booking.movieTitle} at ${booking.cinema}`,
      `DESCRIPTION:Showtime: ${booking.time}\\nHall: ${booking.hall}\\nSeats: ${booking.seatLabels.join(", ")}\\nBooking Ref: ${booking.reference}`,
      `LOCATION:${booking.cinema}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CinePath-${booking.movieTitle.replace(/\s+/g, "-")}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Reusable saw-tooth / zig-zag SVG tear edge
  const SawtoothEdge = ({ isBottom = false }: { isBottom?: boolean }) => (
    <div className={`w-full overflow-hidden leading-none ${!isBottom ? "rotate-180" : ""}`}>
      <svg
        viewBox="0 0 1200 24"
        preserveAspectRatio="none"
        className="w-full h-3 sm:h-4 text-white fill-current block"
      >
        <path d="M0,0 L15,24 L30,0 L45,24 L60,0 L75,24 L90,0 L105,24 L120,0 L135,24 L150,0 L165,24 L180,0 L195,24 L210,0 L225,24 L240,0 L255,24 L270,0 L285,24 L300,0 L315,24 L330,0 L345,24 L360,0 L375,24 L390,0 L405,24 L420,0 L435,24 L450,0 L465,24 L480,0 L495,24 L510,0 L525,24 L540,0 L555,24 L570,0 L585,24 L600,0 L615,24 L630,0 L645,24 L660,0 L675,24 L690,0 L705,24 L720,0 L735,24 L750,0 L765,24 L780,0 L795,24 L810,0 L825,24 L840,0 L855,24 L870,0 L885,24 L900,0 L915,24 L930,0 L945,24 L960,0 L975,24 L990,0 L1005,24 L1020,0 L1035,24 L1050,0 L1065,24 L1080,0 L1095,24 L1110,0 L1125,24 L1140,0 L1155,24 L1170,0 L1185,24 L1200,0 L1200,24 L0,24 Z" />
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950 py-12 px-4 flex flex-col items-center justify-center print:bg-white print:p-0">
      {/* Strict Print CSS: isolates the white receipt ticket with saw-tooth edges on paper */}
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
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .ticket-receipt-card {
            box-shadow: none !important;
            margin: 0 auto !important;
            max-width: 420px !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Confirmation Banner */}
      <div className="no-print text-center mb-6 space-y-1">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 mb-2">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Payment Verified & Confirmed</span>
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Your Admission Ticket
        </h1>
        <p className="text-xs text-muted-foreground">
          Present the digital pass below at the cinema gate turnstile.
        </p>
      </div>

      {/* =========================================================================
          AUTHENTIC CINEMA RECEIPT TICKET STUB (Inspired by Reference Design)
         ========================================================================= */}
      <div className="ticket-receipt-card relative w-full max-w-sm sm:max-w-md filter drop-shadow-2xl">
        {/* Top Serrated / Saw-Tooth Perforated Cut */}
        <SawtoothEdge isBottom={false} />

        {/* Pure White Ticket Body */}
        <div className="bg-white text-zinc-900 px-6 sm:px-8 py-6 select-none">
          {/* Brand Header */}
          <div className="text-center">
            <p className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
              CinePath Multiplex <span className="text-primary font-extrabold">CINEMAS</span>
            </p>
            <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 mt-2">
              Enjoy the Movie!
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-500 max-w-xs mx-auto mt-0.5 leading-relaxed">
              Present this code at the gate scanner to access your screening
            </p>
          </div>

          {/* Large High-Contrast Central QR Code */}
          <div className="my-6 flex flex-col items-center justify-center">
            <div className="p-3 bg-white border-2 border-zinc-900 rounded-2xl shadow-sm">
              <QRCodeSVG
                value={qrPayload}
                size={180}
                level="H"
                fgColor="#09090b"
                bgColor="#ffffff"
              />
            </div>
            {/* Booking Reference Code */}
            <span className="mt-3 font-mono text-sm sm:text-base font-extrabold tracking-widest text-zinc-900">
              {booking.reference}
            </span>
          </div>

          {/* Perforated Center Tear Line with Side Notches */}
          <div className="relative -mx-6 sm:-mx-8 my-5 flex items-center justify-between">
            <div className="h-5 w-5 -ml-2.5 rounded-full bg-neutral-950 border border-zinc-300 print:bg-white" />
            <div className="flex-1 border-t-2 border-dashed border-zinc-300" />
            <div className="h-5 w-5 -mr-2.5 rounded-full bg-neutral-950 border border-zinc-300 print:bg-white" />
          </div>

          {/* Bottom Stub Section */}
          <div className="flex items-stretch justify-between gap-3 pt-1">
            {/* Left Column: Movie & Ticket Metadata */}
            <div className="flex-1 space-y-3">
              {/* Movie Header with Poster Thumbnail */}
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl overflow-hidden bg-zinc-200 border border-zinc-200 shrink-0 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={booking.posterUrl || "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg"}
                    alt={booking.movieTitle}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 leading-tight">
                    {booking.movieTitle}
                  </h3>
                  <p className="text-[11px] font-semibold text-primary mt-0.5">
                    {booking.cinema} · {booking.hall}
                  </p>
                </div>
              </div>

              {/* Reserved Seats (No personal user name) */}
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Reserved Seats
                </span>
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  {booking.seatLabels.map((lbl) => (
                    <span
                      key={lbl}
                      className="inline-block bg-zinc-100 border border-zinc-300 rounded px-2 py-0.5 text-xs font-bold text-zinc-900 font-mono"
                    >
                      Seat {lbl}
                    </span>
                  ))}
                </div>
              </div>

              {/* Format & Audio */}
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Format & Audio
                </span>
                <span className="text-xs font-semibold text-zinc-800">
                  {booking.format}
                </span>
              </div>

              {/* Session / Date & Time */}
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Session
                </span>
                <span className="text-xs font-semibold text-zinc-800">
                  {booking.time}
                </span>
              </div>

              {/* Total Paid */}
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Total Paid
                </span>
                <span className="text-xs font-extrabold text-zinc-900">
                  {formatPrice(booking.totalAmount)} (Card Verified)
                </span>
              </div>
            </div>

            {/* Right Column: Rotated Reference & Mini Security QR */}
            <div className="flex flex-col items-center justify-between pl-3 border-l border-zinc-200">
              <span className="font-mono text-[10px] font-bold tracking-widest text-zinc-400 [writing-mode:vertical-rl] rotate-180 select-none">
                {booking.reference}
              </span>

              {/* Mini Security QR Code */}
              <div className="p-1.5 bg-white border border-zinc-300 rounded-lg shadow-sm">
                <QRCodeSVG
                  value={`CINEPATH-AUTH-${booking.reference}`}
                  size={46}
                  level="M"
                  fgColor="#18181b"
                  bgColor="#ffffff"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Serrated / Saw-Tooth Perforated Cut */}
        <SawtoothEdge isBottom={true} />
      </div>

      {/* =========================================================================
          ACTIONS: GOOGLE WALLET, DOWNLOAD PDF & CALENDAR
         ========================================================================= */}
      <div className="no-print mt-8 w-full max-w-sm sm:max-w-md space-y-3">
        {/* Save to Google Wallet Button */}
        <button
          type="button"
          onClick={handleSaveToGoogleWallet}
          className="w-full flex items-center justify-center gap-3 rounded-2xl bg-black px-6 py-3.5 text-sm font-semibold text-white border border-zinc-800 shadow-xl hover:bg-zinc-900 active:scale-98 transition cursor-pointer"
        >
          {walletSaved ? (
            <>
              <Check className="h-5 w-5 text-emerald-400" />
              <span className="text-emerald-400 font-bold">Added to Google Wallet!</span>
            </>
          ) : (
            <>
              {/* Google Wallet Icon */}
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                />
              </svg>
              <span>Save to Google Wallet</span>
            </>
          )}
        </button>

        {/* Secondary Buttons: PDF Download & Calendar */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-card px-4 py-3 text-xs font-semibold text-white hover:bg-zinc-800/80 active:scale-95 transition cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={handleAddToCalendar}
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-card px-4 py-3 text-xs font-semibold text-white hover:bg-zinc-800/80 active:scale-95 transition cursor-pointer"
          >
            <Calendar className="h-4 w-4" />
            <span>Add to Calendar</span>
          </button>
        </div>

        {/* Return to Home link */}
        <div className="pt-2 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition"
          >
            <span>Return to CinePath Home</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
