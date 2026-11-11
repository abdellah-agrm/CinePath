"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, MapPin, QrCode, ArrowRight, Film } from "lucide-react";

interface TicketBooking {
  id: string;
  reference: string;
  movieTitle: string;
  poster?: string;
  posterUrl?: string;
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

  useEffect(() => {
    let isMounted = true;
    async function loadTickets() {
      // 1. Fetch user's bookings from PostgreSQL Backend
      try {
        const res = await fetch("/api/bookings");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.bookings) && isMounted && json.bookings.length > 0) {
            setTickets(json.bookings);
            return;
          }
        }
      } catch (err) {
        console.warn("[MyTickets] Backend fetch error:", err);
      }

      // 2. Fallback to localStorage cache
      try {
        const raw = localStorage.getItem("cinepath_user_tickets");
        if (raw && isMounted) {
          const parsed = JSON.parse(raw);
          setTickets(parsed);
        }
      } catch (e) {
        console.warn("Could not load user tickets from storage:", e);
      }
    }

    loadTickets();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = tickets.filter((b) =>
    activeTab === "UPCOMING" ? b.status === "UPCOMING" : b.status !== "UPCOMING"
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-28 sm:pt-36 pb-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-8 lg:px-12">
        {/* Page Header */}
        <div className="border-b border-white/[0.08] pb-8">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Mes E-billets
          </h1>
          <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
            Retrouvez vos réservations et présentez votre QR code à l&apos;entrée de la salle.
          </p>

          {/* Tabs: À venir / Historique */}
          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("UPCOMING")}
              className={`rounded-[6px] px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer active:scale-[0.97] ${
                activeTab === "UPCOMING"
                  ? "bg-[#ffc61a] text-[#0a0a0a]"
                  : "bg-[#1a1a1a] text-[#9ca3af] hover:text-white"
              }`}
            >
              Séances à venir ({tickets.filter((t) => t.status === "UPCOMING").length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("PAST")}
              className={`rounded-[6px] px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer active:scale-[0.97] ${
                activeTab === "PAST"
                  ? "bg-[#ffc61a] text-[#0a0a0a]"
                  : "bg-[#1a1a1a] text-[#9ca3af] hover:text-white"
              }`}
            >
              Historique ({tickets.filter((t) => t.status !== "UPCOMING").length})
            </button>
          </div>
        </div>

        {/* Ticket List */}
        <div className="mt-8 space-y-4">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-white/[0.08] bg-[#141414] py-16 px-4 text-center space-y-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-white/[0.05] text-[#ffc61a]">
                <Film className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-white">Aucune réservation trouvée</h3>
              <p className="text-xs text-[#9ca3af] max-w-sm mx-auto leading-relaxed">
                Vous n&apos;avez pas encore réservé de séance. Découvrez les films actuellement à
                l&apos;affiche au Pathé Californie.
              </p>
              <div className="pt-2">
                <Link
                  href="/movies"
                  className="inline-flex items-center gap-2 rounded-[6px] bg-[#ffc61a] hover:bg-[#ffd147] px-5 py-3 text-xs font-bold text-[#0a0a0a] active:scale-[0.97] transition-transform cursor-pointer"
                >
                  <span>Voir les films à l&apos;affiche</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            filtered.map((booking) => (
              <div
                key={booking.reference}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 rounded-xl border border-white/[0.08] bg-[#141414] p-5 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-20 w-14 shrink-0 rounded-[4px] overflow-hidden bg-neutral-900 flex items-center justify-center">
                    {booking.posterUrl || booking.poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={booking.posterUrl || booking.poster}
                        alt={booking.movieTitle}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Film className="h-6 w-6 text-[#ffc61a]" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#9ca3af]">
                        #{booking.reference}
                      </span>
                      <span className="rounded-[4px] bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        CONFIRMÉ
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-white leading-tight">
                      {booking.movieTitle}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#9ca3af] pt-0.5">
                      <span className="flex items-center gap-1 text-neutral-200">
                        <Clock className="h-3.5 w-3.5 text-[#ffc61a]" /> {booking.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#ffc61a]" /> {booking.cinema} ·{" "}
                        {booking.hall}
                      </span>
                    </div>

                    <div className="pt-1.5 flex flex-wrap gap-1.5">
                      {booking.seats.map((seat, sIdx) => (
                        <span
                          key={sIdx}
                          className="rounded-[4px] bg-white/[0.08] px-2 py-0.5 text-[11px] font-bold text-white"
                        >
                          {seat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <Link
                  href={`/tickets/${booking.reference}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[6px] bg-[#ffc61a] hover:bg-[#ffd147] px-5 py-3 text-xs font-bold text-[#0a0a0a] active:scale-[0.97] transition-transform shrink-0 cursor-pointer"
                >
                  <QrCode className="h-4 w-4" />
                  <span>Afficher mon e-billet</span>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
