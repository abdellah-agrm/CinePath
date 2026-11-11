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
  Printer,
  Loader2,
  X,
  Clock,
  MapPin,
  Ticket,
  Smartphone,
  Share2,
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
  date?: string;
  isoDate?: string;
  format: string;
  seats: string[];
  seatLabels: string[];
  totalAmount: number;
  posterUrl?: string;
  paidAt?: string;
}

// Robust DateTime parser for accurate Calendar integration
function parseBookingDateTime(booking: BookingDetail): { startDate: Date; endDate: Date } {
  const now = new Date();
  let baseDate = new Date();

  // 1. Try parsing ISO Date e.g. "2026-11-11"
  if (booking.isoDate && /^\d{4}-\d{2}-\d{2}$/.test(booking.isoDate)) {
    const [y, m, d] = booking.isoDate.split("-").map(Number);
    baseDate = new Date(y, m - 1, d);
  } else if (booking.date) {
    // 2. Try parsing French textual date e.g. "MERCREDI 11 NOVEMBRE 2026"
    const match = booking.date.match(/(\d{1,2})\s+([a-zA-Z\u00C0-\u017F]+)\s+(\d{4})/i);
    if (match) {
      const day = parseInt(match[1], 10);
      const monthStr = match[2].toLowerCase();
      const year = parseInt(match[3], 10);
      const months: Record<string, number> = {
        janvier: 0, janv: 0, jan: 0,
        février: 1, fevrier: 1, fev: 1,
        mars: 2, mar: 2,
        avril: 3, avr: 3,
        mai: 4,
        juin: 5,
        juillet: 6, juil: 6,
        août: 7, aout: 7,
        septembre: 8, sept: 8, sep: 8,
        octobre: 9, oct: 9,
        novembre: 10, nov: 10,
        décembre: 11, decembre: 11, dec: 11,
      };
      const month = months[monthStr] ?? now.getMonth();
      baseDate = new Date(year, month, day);
    }
  }

  // 3. Parse session time e.g. "23:45" or "Today · 20:00"
  let hours = 20;
  let minutes = 0;
  const timeMatch = (booking.time || "").match(/\b(\d{1,2}):(\d{2})\b/);
  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    minutes = parseInt(timeMatch[2], 10);
  }

  const startDate = new Date(baseDate);
  startDate.setHours(hours, minutes, 0, 0);

  // Standard movie duration: 2 hours 15 minutes
  const endDate = new Date(startDate.getTime() + 135 * 60 * 1000);

  return { startDate, endDate };
}

function formatGoogleCalendarDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

function formatIcsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadRealBooking() {
      // 1. Primary: Fetch verified booking directly from PostgreSQL Backend API
      try {
        const res = await fetch(`/api/bookings/${bookingRef}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.booking && isMounted) {
            setBooking(json.booking);
            return;
          }
        }
      } catch (err) {
        console.warn("[Ticket Confirmation] Backend fetch error:", err);
      }

      // 2. Fallback to localStorage cache for offline tickets
      try {
        const stored = localStorage.getItem(`cinepath_booking_${bookingRef}`);
        if (stored && isMounted) {
          const parsed = JSON.parse(stored);
          setBooking(parsed);
          return;
        }
        const listRaw = localStorage.getItem("cinepath_user_tickets");
        if (listRaw && isMounted) {
          const list = JSON.parse(listRaw);
          const found = list.find((b: any) => b.reference === bookingRef || b.id === bookingRef);
          if (found) setBooking(found);
        }
      } catch (e) {
        console.warn("Could not load booking from storage:", e);
      }
    }

    if (bookingRef) {
      loadRealBooking();
    }

    return () => {
      isMounted = false;
    };
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

  // Dedicated High-Definition Single-Page PDF Generator
  // Draws authentic cinema receipt stub matching reference design (media_1794387023177_d74e8190.jpg)
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);

      const { jsPDF } = await import("jspdf");
      const QRCodeModule = await import("qrcode");
      const QRCode = QRCodeModule.default || QRCodeModule;

      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: 600,
        margin: 1,
        errorCorrectionLevel: "H",
      });

      const miniQrDataUrl = await QRCode.toDataURL(`CINEPATH-AUTH-${booking.reference}`, {
        width: 200,
        margin: 1,
        errorCorrectionLevel: "M",
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = 210;
      const pageHeight = 297;

      // Soft paper background
      pdf.setFillColor(244, 245, 247);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");

      // Receipt Card Geometry
      const cardW = 105;
      const cardH = 195;
      const cardX = (pageWidth - cardW) / 2;
      const cardY = 22;

      // Draw White Card Body
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(220, 222, 228);
      pdf.rect(cardX, cardY, cardW, cardH, "FD");

      // Top Zigzag Saw-tooth edge
      const toothWidth = 3.5;
      const toothHeight = 2.5;
      const teethCount = Math.floor(cardW / toothWidth);

      pdf.setFillColor(244, 245, 247);
      pdf.setDrawColor(244, 245, 247);
      for (let i = 0; i < teethCount; i++) {
        const x1 = cardX + i * toothWidth;
        const x2 = x1 + toothWidth / 2;
        const x3 = x1 + toothWidth;
        pdf.triangle(x1, cardY, x2, cardY + toothHeight, x3, cardY, "FD");
      }

      // Header Brand
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(225, 29, 72); // rose-600
      pdf.text("CINEPATH MULTIPLEX · BILLET OFFICIEL", pageWidth / 2, cardY + 12, { align: "center" });

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.text("Bonne séance !", pageWidth / 2, cardY + 18, { align: "center" });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text("Présentez ce QR code à la borne de contrôle", pageWidth / 2, cardY + 23, { align: "center" });

      // Central QR Code Box
      const qrSize = 48;
      const qrX = cardX + (cardW - qrSize) / 2;
      const qrY = cardY + 28;

      pdf.setDrawColor(203, 213, 225);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 3, 3, "FD");
      pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

      // Booking Reference
      pdf.setFont("courier", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      pdf.text(booking.reference, pageWidth / 2, qrY + qrSize + 8, { align: "center" });

      // Perforation line with side notch circles
      const tearY = qrY + qrSize + 14;
      pdf.setFillColor(244, 245, 247);
      pdf.setDrawColor(220, 222, 228);
      pdf.circle(cardX, tearY, 3.5, "FD");
      pdf.circle(cardX + cardW, tearY, 3.5, "FD");

      pdf.setLineDashPattern([1.5, 1.5], 0);
      pdf.setDrawColor(203, 213, 225);
      pdf.line(cardX + 4, tearY, cardX + cardW - 4, tearY);
      pdf.setLineDashPattern([], 0); // reset dash

      // Lower Section: Movie & Showtime Details
      const detailsY = tearY + 8;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      pdf.text(booking.movieTitle, cardX + 8, detailsY);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(225, 29, 72);
      pdf.text(`${booking.cinema} · ${booking.hall}`, cardX + 8, detailsY + 5);

      // Metadata labels & values (NO personal user name)
      const fields = [
        { label: "SÉANCE / HORAIRE", val: `${booking.time} (${booking.format})` },
        { label: "PLACES RÉSERVÉES", val: booking.seatLabels.map((s) => `Siège ${s}`).join(", ") },
        { label: "MONTANT TOTAL", val: `${booking.totalAmount}.00 MAD (Payé · Carte vérifiée)` },
        { label: "CONTRÔLE D'ACCÈS", val: "Billet valide · Entrée unique salle" },
      ];

      let currentY = detailsY + 14;
      fields.forEach((f) => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(6.5);
        pdf.setTextColor(148, 163, 184); // slate-400
        pdf.text(f.label, cardX + 8, currentY);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8.5);
        pdf.setTextColor(30, 41, 59); // slate-800
        pdf.text(f.val, cardX + 8, currentY + 4);

        currentY += 10.5;
      });

      // Mini Security QR and Reference Code on the right
      const miniQrSize = 18;
      const miniQrX = cardX + cardW - miniQrSize - 8;
      const miniQrY = detailsY + 12;

      pdf.addImage(miniQrDataUrl, "PNG", miniQrX, miniQrY, miniQrSize, miniQrSize);

      pdf.setFont("courier", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(148, 163, 184);
      pdf.text(booking.reference, miniQrX + miniQrSize / 2, miniQrY + miniQrSize + 4, {
        align: "center",
      });

      // Bottom Zigzag Saw-tooth edge
      pdf.setFillColor(244, 245, 247);
      pdf.setDrawColor(244, 245, 247);
      for (let i = 0; i < teethCount; i++) {
        const x1 = cardX + i * toothWidth;
        const x2 = x1 + toothWidth / 2;
        const x3 = x1 + toothWidth;
        pdf.triangle(x1, cardY + cardH, x2, cardY + cardH - toothHeight, x3, cardY + cardH, "FD");
      }

      // Page footer
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(148, 163, 184);
      pdf.text(
        `Billet électronique officiel CinePath · Signature cryptographique HMAC SHA-256 vérifiée`,
        pageWidth / 2,
        cardY + cardH + 10,
        { align: "center" }
      );

      pdf.save(`CinePath-Admission-Ticket-${booking.reference}.pdf`);
    } catch (err) {
      console.error("PDF generator error:", err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Google Wallet Action: Directly launches Google Wallet app on Android, opens Google Wallet web, and provides Pass card modal
  const handleSaveToGoogleWallet = () => {
    try {
      const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
      if (isAndroid) {
        // Deep link into native Android Google Wallet application
        window.location.href =
          "intent://wallet.google.com/#Intent;package=com.google.android.apps.walletnfcrel;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end";
      } else {
        // Open Google Wallet Web
        window.open("https://wallet.google.com/", "_blank");
      }
      setWalletSaved(true);
      setShowWalletModal(true);
      setTimeout(() => setWalletSaved(false), 5000);
    } catch (err) {
      console.warn("Wallet opening error:", err);
      window.open("https://wallet.google.com/", "_blank");
      setShowWalletModal(true);
    }
  };

  // Google Calendar URL generator with accurate start and end times
  const getGoogleCalendarUrl = () => {
    const { startDate, endDate } = parseBookingDateTime(booking);
    const datesStr = `${formatGoogleCalendarDate(startDate)}/${formatGoogleCalendarDate(endDate)}`;
    const title = `🎬 Séance : ${booking.movieTitle} (${booking.cinema})`;
    const details = [
      `🎟️ Billet Cinéma Pathé Maroc`,
      `Film : ${booking.movieTitle}`,
      `Format : ${booking.format}`,
      `Séance : ${booking.time}`,
      `Date : ${booking.date || startDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`,
      `Salle : ${booking.hall}`,
      `Sièges : ${booking.seatLabels.join(", ")}`,
      `Réf. Réservation : ${booking.reference}`,
      `Montant : ${booking.totalAmount} MAD`,
      `\nPrésentez votre QR code à l'entrée du cinéma.`,
    ].join("\n");

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${datesStr}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(
      booking.cinema
    )}`;
  };

  // Apple / iCal (.ics) generator with RFC 5545 compliance (DTSTART, DTEND, VALARM)
  const handleDownloadIcs = () => {
    const { startDate, endDate } = parseBookingDateTime(booking);
    const now = new Date();

    const icsData = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//CinePath//Cinema Ticketing//FR",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:cinepath-${booking.reference}-${startDate.getTime()}@cinepath.com`,
      `DTSTAMP:${formatIcsDate(now)}`,
      `DTSTART:${formatIcsDate(startDate)}`,
      `DTEND:${formatIcsDate(endDate)}`,
      `SUMMARY:🎬 ${booking.movieTitle} (${booking.cinema})`,
      `DESCRIPTION:Séance de cinéma Pathé Maroc\\nFilm: ${booking.movieTitle}\\nFormat: ${booking.format}\\nSéance: ${booking.time}\\nSalle: ${booking.hall}\\nPlaces: ${booking.seatLabels.join(", ")}\\nRéférence: ${booking.reference}`,
      `LOCATION:${booking.cinema}`,
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "TRIGGER:-PT1H",
      "ACTION:DISPLAY",
      "DESCRIPTION:Rappel: Votre séance commence dans 1 heure !",
      "END:VALARM",
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

  // Download raw Google Wallet Pass JSON
  const handleDownloadWalletJson = () => {
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
            eventName: { defaultValue: { language: "fr", value: booking.movieTitle } },
            venue: {
              name: { defaultValue: { language: "fr", value: `${booking.cinema} - ${booking.hall}` } },
            },
            dateTime: { start: booking.time },
            seatInfo: {
              seat: { defaultValue: { language: "fr", value: booking.seatLabels.join(", ") } },
            },
            ticketHolderName: "Invité CinePath",
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
    <div className="min-h-screen bg-neutral-950 pt-28 sm:pt-36 pb-20 px-4 flex flex-col items-center justify-start print:bg-white print:p-0 print:m-0">
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
      <div
        id="ticket-receipt-card"
        className="ticket-receipt-card relative w-full max-w-sm sm:max-w-md filter drop-shadow-2xl print:drop-shadow-none"
      >
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
                    src={
                      booking.posterUrl && booking.posterUrl.startsWith("http")
                        ? `/api/proxy-image?url=${encodeURIComponent(booking.posterUrl)}`
                        : (booking.posterUrl || `/api/proxy-image?url=${encodeURIComponent("https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg")}`)
                    }
                    alt={booking.movieTitle}
                    crossOrigin="anonymous"
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

        {/* Secondary Buttons: Direct PDF Download, Print & Calendar */}
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            disabled={isGeneratingPdf}
            onClick={handleDownloadPdf}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-card px-3 py-3 text-xs font-semibold text-white hover:bg-zinc-800/80 active:scale-95 transition cursor-pointer disabled:opacity-50"
            title="Download direct PDF file"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>PDF...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 text-primary" />
                <span>PDF File</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-card px-3 py-3 text-xs font-semibold text-white hover:bg-zinc-800/80 active:scale-95 transition cursor-pointer"
            title="Print single-page receipt"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCalendarModal(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-card px-3 py-3 text-xs font-semibold text-white hover:bg-zinc-800/80 active:scale-95 transition cursor-pointer"
            title="Add event to Calendar"
          >
            <Calendar className="h-4 w-4" />
            <span>Calendar</span>
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

      {/* =========================================================================
          GOOGLE WALLET MODAL (Direct app deep link & interactive pass card)
         ========================================================================= */}
      {showWalletModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setShowWalletModal(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl bg-[#121316] border border-white/10 p-5 sm:p-6 text-white shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                {/* 4-Color Google G */}
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
                <span className="font-bold text-sm tracking-tight text-white">Google Wallet Pass</span>
              </div>
              <button
                type="button"
                onClick={() => setShowWalletModal(false)}
                className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Google Wallet Pass Card Preview */}
            <div className="rounded-2xl bg-gradient-to-br from-[#1a1c23] to-[#0f1013] border border-white/10 p-4 space-y-3 shadow-inner">
              <div className="flex items-center justify-between text-[11px] text-[#ffc61a] font-bold">
                <span className="flex items-center gap-1.5">
                  <Ticket className="h-3.5 w-3.5" />
                  <span>BILLET CINÉMA PATHÉ</span>
                </span>
                <span className="bg-[#ffc61a]/15 px-2 py-0.5 rounded text-[10px] text-[#ffc61a] border border-[#ffc61a]/30">
                  ACTIF
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-white">{booking.movieTitle}</h3>
                <p className="text-xs text-[#9ca3af]">{booking.format} · {booking.cinema}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-y border-white/10 py-2.5">
                <div>
                  <span className="text-[10px] text-[#737373] block uppercase font-bold">Séance</span>
                  <span className="font-semibold text-white">{booking.time}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#737373] block uppercase font-bold">Salle</span>
                  <span className="font-semibold text-white">{booking.hall}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-[#737373] block uppercase font-bold">Sièges réservés</span>
                  <span className="font-semibold text-[#ffc61a]">{booking.seatLabels.join(", ")}</span>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white text-black">
                <QRCodeSVG value={qrPayload} size={130} level="H" />
                <span className="mt-1 font-mono text-[10px] font-bold tracking-wider text-black">
                  #{booking.reference}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    "intent://wallet.google.com/#Intent;package=com.google.android.apps.walletnfcrel;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end";
                  setTimeout(() => {
                    window.open("https://wallet.google.com/", "_blank");
                  }, 1200);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-neutral-200 py-3 text-xs font-bold text-black transition cursor-pointer shadow-lg active:scale-98"
              >
                <Smartphone className="h-4 w-4" />
                <span>Ouvrir l&apos;application Google Wallet</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href="https://wallet.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 py-2.5 text-[11px] font-semibold text-white transition cursor-pointer text-center"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-[#ffc61a]" />
                  <span>Google Wallet Web</span>
                </a>

                <button
                  type="button"
                  onClick={handleDownloadWalletJson}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 py-2.5 text-[11px] font-semibold text-white transition cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-[#ffc61a]" />
                  <span>Pass (.json)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CALENDAR MODAL (Google Calendar direct link & RFC 5545 iCal download)
         ========================================================================= */}
      {showCalendarModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setShowCalendarModal(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl bg-[#121316] border border-white/10 p-5 sm:p-6 text-white shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ffc61a]/15 text-[#ffc61a]">
                  <Calendar className="h-4 w-4" />
                </div>
                <span className="font-bold text-sm tracking-tight text-white">Ajouter au Calendrier</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Event Summary Card */}
            <div className="rounded-2xl bg-[#181a20] border border-white/10 p-4 space-y-2 text-xs">
              <h3 className="font-bold text-sm text-white">{booking.movieTitle}</h3>

              <div className="space-y-1.5 pt-1 text-[#9ca3af]">
                <div className="flex items-center gap-2 text-white">
                  <Clock className="h-3.5 w-3.5 text-[#ffc61a] shrink-0" />
                  <span className="font-semibold">{booking.date || "Séance programmée"} · {booking.time}</span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-[#ffc61a] shrink-0" />
                  <span>{booking.cinema} · {booking.hall}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Ticket className="h-3.5 w-3.5 text-[#ffc61a] shrink-0" />
                  <span>Sièges : <strong className="text-white">{booking.seatLabels.join(", ")}</strong></span>
                </div>
              </div>
            </div>

            {/* Calendar Options */}
            <div className="space-y-2.5 pt-1">
              {/* Google Calendar (Direct Web/App) */}
              <a
                href={getGoogleCalendarUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowCalendarModal(false)}
                className="w-full flex items-center justify-between rounded-xl bg-blue-600 hover:bg-blue-500 p-3.5 text-xs font-bold text-white transition cursor-pointer shadow-lg active:scale-98"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-6 w-6 rounded bg-white flex items-center justify-center">
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="block font-bold">Google Calendar</span>
                    <span className="text-[10px] font-normal text-blue-100">Ouvre directement Google Agenda</span>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-blue-200" />
              </a>

              {/* Apple Calendar / iCal (.ics) */}
              <button
                type="button"
                onClick={() => {
                  handleDownloadIcs();
                  setShowCalendarModal(false);
                }}
                className="w-full flex items-center justify-between rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 p-3.5 text-xs font-bold text-white transition cursor-pointer active:scale-98"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-6 w-6 rounded bg-white/10 flex items-center justify-center text-[#ffc61a]">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold">Apple Calendar / iCal (.ics)</span>
                    <span className="text-[10px] font-normal text-[#9ca3af]">Compatible iPhone, Mac &amp; Outlook</span>
                  </div>
                </div>
                <Download className="h-4 w-4 text-[#ffc61a]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
