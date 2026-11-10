"use client";

import { useState } from "react";
import Link from "next/link";
import { Ticket, Calendar, Clock, MapPin, QrCode, ArrowRight } from "lucide-react";

interface TicketBooking {
  id: string;
  reference: string;
  movieTitle: string;
  poster: string;
  cinema: string;
  hall: string;
  date: string;
  time: string;
  seats: string[];
  status: "UPCOMING" | "PAST" | "CANCELLED";
  totalAmount: number;
}

const DEMO_BOOKINGS: TicketBooking[] = [
  {
    id: "b1",
    reference: "CP-48213",
    movieTitle: "Dune: Part Two",
    poster:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
    cinema: "CinePath Anfa",
    hall: "Hall 1 (IMAX)",
    date: "Today, 10 Nov",
    time: "20:00",
    seats: ["C9", "C10"],
    status: "UPCOMING",
    totalAmount: 165,
  },
  {
    id: "b2",
    reference: "CP-39102",
    movieTitle: "Oppenheimer",
    poster:
      "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop&q=80",
    cinema: "CinePath Anfa",
    hall: "Hall 3 (VIP)",
    date: "24 Oct 2026",
    time: "18:00",
    seats: ["D5", "D6"],
    status: "PAST",
    totalAmount: 180,
  },
];

export default function MyTicketsPage() {
  const [activeTab, setActiveTab] = useState<"UPCOMING" | "PAST">("UPCOMING");

  const filtered = DEMO_BOOKINGS.filter((b) =>
    activeTab === "UPCOMING" ? b.status === "UPCOMING" : b.status !== "UPCOMING"
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-24">
      {/* Page Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">My Tickets</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Access your digital admission passes, QR codes, and booking history
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
            Upcoming Movies
          </button>
          <button
            onClick={() => setActiveTab("PAST")}
            className={`rounded-xl px-5 py-2 text-xs font-semibold transition ${
              activeTab === "PAST"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "border border-border bg-card text-muted-foreground hover:text-white"
            }`}
          >
            Past History
          </button>
        </div>
      </div>

      {/* Ticket List */}
      <div className="mt-8 space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border py-16 text-center">
            <Ticket className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-semibold text-white">No tickets found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              You do not have any {activeTab.toLowerCase()} movie reservations.
            </p>
            <Link
              href="/movies"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
            >
              Browse Movies
            </Link>
          </div>
        ) : (
          filtered.map((ticket) => (
            <div
              key={ticket.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40"
            >
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ticket.poster}
                    alt={ticket.movieTitle}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">
                      #{ticket.reference}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                        ticket.status === "UPCOMING"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base mt-0.5">
                    {ticket.movieTitle}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-primary" /> {ticket.date} ·{" "}
                      {ticket.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> {ticket.cinema} (
                      {ticket.hall})
                    </span>
                  </div>

                  <div className="mt-2 flex gap-1.5">
                    {ticket.seats.map((seat) => (
                      <span
                        key={seat}
                        className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-semibold text-primary"
                      >
                        Seat {seat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-border/60 pt-3 sm:pt-0">
                <Link
                  href={`/tickets/${ticket.reference}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary/90 transition"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  View QR Pass
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

