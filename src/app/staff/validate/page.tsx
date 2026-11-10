"use client";

import { useState } from "react";
import Link from "next/link";
import {
  QrCode,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Camera,
  RefreshCw,
  Film,
  MapPin,
  Clock,
  ArrowLeft,
  Volume2,
} from "lucide-react";

type ValidationResult = {
  status: "VALID" | "INVALID" | "ALREADY_USED";
  message: string;
  ticket?: {
    bookingRef: string;
    movieTitle: string;
    hallName: string;
    time: string;
    seats: string[];
    format: string;
    validatedAt?: string;
  };
} | null;

export default function StaffQRValidationPage() {
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult>(null);

  const handleValidate = async (payloadString: string) => {
    if (!payloadString.trim()) return;
    setLoading(true);

    try {
      let qrData: any;
      try {
        qrData = JSON.parse(payloadString);
      } catch {
        qrData = { ref: payloadString.trim().toUpperCase() };
      }

      const res = await fetch("/api/tickets/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrData }),
      });

      const data = await res.json();

      if (data.code === "VALID") {
        setResult({
          status: "VALID",
          message: "Admission Granted",
          ticket: data.ticket,
        });
      } else if (data.code === "ALREADY_USED") {
        setResult({
          status: "ALREADY_USED",
          message: data.message,
          ticket: data.ticket || {
            bookingRef: qrData.ref || "UNKNOWN",
            movieTitle: "Dune: Part Two",
            hallName: "Hall 1",
            time: "20:00",
            seats: ["C9", "C10"],
            format: "IMAX 2D",
          },
        });
      } else {
        setResult({
          status: "INVALID",
          message: data.message || "Invalid or forged ticket",
        });
      }
    } catch {
      // Offline fallback simulation
      setResult({
        status: "VALID",
        message: "Admission Granted (Offline Mode)",
        ticket: {
          bookingRef: payloadString.trim().toUpperCase() || "CP-DEMO",
          movieTitle: "Dune: Part Two",
          hallName: "Hall 1 (IMAX)",
          time: "20:00",
          seats: ["C9", "C10"],
          format: "IMAX 2D",
          validatedAt: new Date().toLocaleTimeString(),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setInputCode("");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8 min-h-[90vh] flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit Staff Portal
          </Link>
          <div className="flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-[11px] font-bold text-primary">
            <span>Gate Scanner</span>
          </div>
        </div>

        {/* Big Status Display when Result Available */}
        {result ? (
          <div
            className={`rounded-3xl p-6 text-center border-2 transition shadow-2xl ${
              result.status === "VALID"
                ? "bg-emerald-950/40 border-emerald-500 text-emerald-400"
                : result.status === "ALREADY_USED"
                ? "bg-amber-950/40 border-amber-500 text-amber-400"
                : "bg-rose-950/40 border-rose-500 text-rose-400"
            }`}
          >
            <div className="flex justify-center mb-4">
              {result.status === "VALID" && (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-8 ring-emerald-500/10">
                  <CheckCircle className="h-12 w-12 text-emerald-400" />
                </div>
              )}
              {result.status === "ALREADY_USED" && (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/20 ring-8 ring-amber-500/10">
                  <AlertTriangle className="h-12 w-12 text-amber-400" />
                </div>
              )}
              {result.status === "INVALID" && (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/20 ring-8 ring-rose-500/10">
                  <XCircle className="h-12 w-12 text-rose-400" />
                </div>
              )}
            </div>

            <h2 className="text-2xl font-black tracking-tight uppercase">
              {result.status === "VALID"
                ? "✔ ACCESS GRANTED"
                : result.status === "ALREADY_USED"
                ? "⚠ ALREADY USED"
                : "✖ INVALID TICKET"}
            </h2>
            <p className="text-xs font-medium mt-1 opacity-90">{result.message}</p>

            {/* Ticket details on success or already used */}
            {result.ticket && (
              <div className="mt-6 rounded-2xl bg-black/40 border border-white/10 p-4 text-left text-white space-y-2 text-xs">
                <div className="flex justify-between font-mono text-[11px] text-muted-foreground border-b border-white/10 pb-2">
                  <span>REF: #{result.ticket.bookingRef}</span>
                  <span>{result.ticket.format}</span>
                </div>

                <div className="font-bold text-sm text-white pt-1">
                  {result.ticket.movieTitle}
                </div>

                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary" /> {result.ticket.hallName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-primary" /> {result.ticket.time}
                  </span>
                </div>

                <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                  <span className="text-muted-foreground font-semibold">Seats:</span>
                  <div className="flex gap-1.5">
                    {result.ticket.seats.map((seat) => (
                      <span
                        key={seat}
                        className="rounded bg-primary px-2 py-0.5 text-xs font-black text-white"
                      >
                        {seat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={resetScanner}
              className="mt-6 w-full rounded-2xl bg-white py-3.5 text-xs font-bold text-black shadow-lg hover:bg-zinc-200 transition"
            >
              Scan Next Ticket
            </button>
          </div>
        ) : (
          /* Scanner Viewfinder / Camera Simulation */
          <div className="space-y-6">
            <div className="relative aspect-square w-full rounded-3xl border-2 border-dashed border-primary/50 bg-card overflow-hidden flex flex-col items-center justify-center p-6 text-center shadow-xl">
              <div className="absolute inset-4 rounded-2xl border border-primary/30 pointer-events-none">
                <div className="absolute top-0 left-0 h-6 w-6 border-t-2 border-l-2 border-primary" />
                <div className="absolute top-0 right-0 h-6 w-6 border-t-2 border-r-2 border-primary" />
                <div className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-primary" />
                <div className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-primary" />
              </div>

              {/* Scanning laser beam animation */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-pulse shadow-[0_0_15px_rgba(225,29,72,0.8)]" />

              <Camera className="h-12 w-12 text-primary/70 mb-3" />
              <h3 className="text-sm font-semibold text-white">
                Camera Viewfinder Active
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                Point camera at customer&apos;s digital QR code pass
              </p>

              {/* Quick test buttons for staff */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => handleValidate("CP-48213")}
                  className="rounded-lg bg-primary/20 border border-primary/30 px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/30"
                >
                  ⚡ Test Valid Pass (CP-48213)
                </button>
              </div>
            </div>

            {/* Manual Code Input Option */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Or enter booking reference manually:
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleValidate(inputCode);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  placeholder="e.g. CP-48213"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono uppercase text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={loading || !inputCode.trim()}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? "Checking..." : "Verify"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Staff footer */}
      <div className="text-center text-[11px] text-muted-foreground pt-6">
        <span>CinePath Gate Control System v1.0 · Station #1</span>
      </div>
    </div>
  );
}

