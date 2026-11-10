"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Ticket, Calendar, Clock, MapPin, QrCode, ArrowRight, Film } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface TicketBooking {
  id: string;
  reference: string;
  movieTitle: string;
  poster?: string;
  cinema: string;
  hall: string;
  date?: string;
  time: string;
  seats: string[];
  status: "UPCOMING" | "PAST" | "CANCELLED";
  totalAmount: number;
}

export default function MyTicketsPage() {
  const [activeTab, setActiveTab] = useState<"UPCOMING" | "PAST">("UPCOMING");
  const [tickets, setTickets] = useState<TicketBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cinepath_user_tickets");
      if (raw) {
        const parsed = JSON.parse(raw);
        setTickets(parsed);
      }
    } catch (e) {
      console.warn("Could not load user tickets:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const filtered = tickets.filter((b) =>
    activeTab === "UPCOMING" ? b.status === "UPCOMING" : b.status !== "UPCOMING"
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-24">
      {/* Page Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">My Tickets</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Access your digital admission passes, QR codes, and reservation history
        </p>

        {/* Tabs: Upcoming / Past */}
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setActiveTab("UPCOMING")}
            className={`rounded-xl px-5 py-2 text-xs font-semibold transition ${
              activeTab === "UPCOMING"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "border border-border bg-card text-muted-foreground hover:text-white"
            }`}
          >
            Upcoming Movies ({tickets.filter((t) => t.status === "UPCOMING").length})
          </button>
          <button
            onClick={() => setActiveTab("PAST")}
            className={`rounded-xl px-5 py-2 text-xs font-semibold transition ${
              activeTab === "PAST"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "border border-border bg-card text-muted-foreground hover:text-white"
            }`}
          >
            Past History ({tickets.filter((t) => t.status !== "UPCOMING").length})
          </button>
        </div>
      </div>

      {/* Ticket List */}
      <div className="mt-8 space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border py-16 px-4 text-center space-y-3">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-card border border-border text-muted-foreground/50">
              <Film className="h-7 w-7 text-primary/60" />
            </div>
            <h3 className="text-base font-semibold text-white">No {activeTab.toLowerCase()} tickets found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              You haven&apos;t booked any tickets yet. Explore movies now playing in theatres and reserve your seats!
            </p>
            <div className="pt-2">
              <Link
                href="/movies"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition"
              >
                <span>Browse Now Showing</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          filtered.map((booking) => (
            <div
              key={booking.reference}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                  <Film className="h-8 w-8" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      #{booking.reference}
                    </span>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                      {booking.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-1">
                    {booking.movieTitle}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-primary" /> {booking.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-primary" /> {booking.cinema} ({booking.hall})
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {booking.seats.map((seat, sIdx) => (
                      <span
                        key={sIdx}
                        className="rounded-lg bg-background border border-border px-2 py-0.5 text-[11px] font-semibold text-white"
                      >
                        {seat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <Link
                href={`/tickets/${booking.reference}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary/90 transition shrink-0"
              >
                <QrCode className="h-4 w-4" />
                <span>View QR Pass</span>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
