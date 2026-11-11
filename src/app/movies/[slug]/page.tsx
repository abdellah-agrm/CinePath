"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ThumbsUp,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Play,
  X,
  Accessibility,
  Loader2,
  Film,
  Check,
} from "lucide-react";
import { CinemaFAQ } from "@/components/cinema-faq";

interface MovieDetail {
  title: string;
  slug: string;
  rating: string;
  ageRating: string;
  duration: string;
  genres: string[];
  releaseDate: string;
  synopsis: string;
  director: string;
  cast: string[];
  backdrop: string;
  poster: string;
  showtimes: Array<{
    id: string;
    time: string;
    hall: string;
    format: string;
    language: string;
    fromPrice: number;
    badge: string | null;
  }>;
}

interface SelectedDrawerSession {
  id: string;
  time: string;
  endTime: string;
  format: string | null;
  language: string;
  hall: string;
  capacity: number;
  dateLabel: string;
  fullDate: string;
  price: number;
}

export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0); // Default to today
  const [isLiked, setIsLiked] = useState(false);
  const [isFavoriteCinema, setIsFavoriteCinema] = useState(false);
  const [inList, setInList] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  // Quick Slide-over Drawer State (pathe_booking_01.jpeg)
  const [activeDrawerSession, setActiveDrawerSession] = useState<SelectedDrawerSession | null>(null);

  // Generate 8-day calendar strip dynamically matching current date
  const days = useMemo(() => {
    const list = [];
    const frenchDays = ["DIM.", "LUN.", "MAR.", "MER.", "JEU.", "VEN.", "SAM."];
    const frenchFullDays = ["DIMANCHE", "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];
    const frenchMonths = ["JAN.", "FÉV.", "MARS", "AVR.", "MAI", "JUIN", "JUIL.", "AOÛT", "SEPT.", "OCT.", "NOV.", "DÉC."];
    const frenchFullMonths = ["JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN", "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE"];

    const today = new Date();
    for (let i = 0; i < 8; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayCode = frenchDays[d.getDay()];
      const dayFull = frenchFullDays[d.getDay()];
      const dayNum = d.getDate();
      const monthCode = frenchMonths[d.getMonth()];
      const monthFull = frenchFullMonths[d.getMonth()];
      const year = d.getFullYear();

      const isoDate = `${year}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      let label = `${dayCode} ${dayNum} ${monthCode}`;
      if (i === 0) label = "Aujourd'hui";
      else if (i === 1) label = "Demain";

      list.push({
        label,
        dayCode,
        dayNum,
        monthCode,
        fullDate: `${dayFull} ${dayNum} ${monthFull} ${year}`,
        isoDate,
        isRelative: i < 2,
      });
    }
    return list;
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchMovieDetails() {
      try {
        setLoading(true);
        const res = await fetch(`/api/movies/${slug}`, { signal: controller.signal });
        const json = await res.json();
        if (json.success && json.data) {
          setMovie(json.data);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch movie details:", err);
        }
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchMovieDetails();
    }

    return () => {
      controller.abort();
    };
  }, [slug]);

  // Showtimes for Pathé Californie matching pathe_movie_page.png & pathe_booking_01.jpeg
  const showtimesList = useMemo(() => {
    return [
      {
        id: `session-${slug}-1`,
        time: "12:45",
        endTime: "14:54",
        format: "4DX",
        language: "VOSTFR",
        hall: "Salle 1",
        capacity: 120,
        price: 130,
      },
      {
        id: `session-${slug}-2`,
        time: "17:15",
        endTime: "19:24",
        format: "4DX",
        language: "VF",
        hall: "Salle 1",
        capacity: 120,
        price: 130,
      },
      {
        id: `session-${slug}-3`,
        time: "23:45",
        endTime: "01:54",
        format: null,
        language: "VOSTFR",
        hall: "Salle 3",
        capacity: 108,
        price: 90,
      },
    ];
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[75vh] flex-col items-center justify-center gap-3 text-neutral-400 bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-[#ffc61a]" />
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Chargement de la séance...
        </p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="py-24 text-center bg-[#0a0a0a] text-white">
        <Film className="mx-auto h-12 w-12 text-neutral-600 mb-3" />
        <h2 className="text-xl font-bold">Film introuvable</h2>
        <Link href="/movies" className="mt-4 inline-block text-xs font-bold text-[#ffc61a] underline">
          Retour au catalogue des films
        </Link>
      </div>
    );
  }

  const selectedDay = days[selectedDayIndex];
  const displayDuration = movie.duration?.replace(/\s+/g, "") || "1h49";

  const handleOpenDrawer = (s: typeof showtimesList[0]) => {
    setActiveDrawerSession({
      ...s,
      dateLabel: selectedDay.label,
      fullDate: selectedDay.fullDate,
    });
  };

  const handleConfirmBooking = () => {
    if (!activeDrawerSession) return;
    const selectedDay = days[selectedDayIndex] || days[0];
    router.push(
      `/booking/${activeDrawerSession.id}/seats?movie=${movie.slug}&cinema=pathe-californie&day=${selectedDayIndex}&time=${encodeURIComponent(
        activeDrawerSession.time
      )}&hall=${encodeURIComponent(activeDrawerSession.hall)}&fmt=${encodeURIComponent(
        activeDrawerSession.format || "VOSTFR"
      )}&date=${encodeURIComponent(activeDrawerSession.fullDate || selectedDay.fullDate)}&isoDate=${encodeURIComponent(
        selectedDay.isoDate || ""
      )}`
    );
  };

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen">
      {/* =========================================================================
          FULL-BLEED HERO WITH EMBEDDED PLAY BUTTON & BOTTOM DATE STRIP
          (Matches pathe_movie_page.png 1:1)
         ========================================================================= */}
      <section className="relative overflow-hidden bg-[#121110] pt-28 sm:pt-36 pb-8">
        {/* Full-bleed Backdrop Image on Right/Top */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={movie.backdrop || movie.poster}
            alt={movie.title}
            className="h-full w-full object-cover object-center sm:object-[70%_22%] opacity-85"
          />

          {/* Left-to-right gradient so text on left is ultra-legible */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, #11100f 0%, rgba(17,16,15,0.92) 38%, rgba(17,16,15,0.35) 68%, rgba(17,16,15,0.15) 100%)",
            }}
          />

          {/* Bottom-to-top warm ambient fade behind the date strip */}
          <div
            className="absolute inset-x-0 bottom-0 h-56"
            style={{
              background:
                "linear-gradient(0deg, #11100f 0%, rgba(28,25,22,0.92) 45%, transparent 100%)",
            }}
          />
        </div>

        {/* Hero Main Content + Play Button */}
        <div className="relative z-10 mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pb-12 sm:pb-16">
            {/* Left Column: Film Metadata */}
            <div className="lg:col-span-7 space-y-4">
              {/* Condensed Giant Title */}
              <h1 className="font-display text-5xl sm:text-6xl lg:text-[64px] font-black uppercase tracking-[0.01em] text-white leading-[0.92]">
                {movie.title}
              </h1>

              {/* Action Buttons: "+≡ Ma liste" & "👍 Noter" */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setInList(!inList)}
                  className={`inline-flex items-center gap-2 rounded-[6px] px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer active:scale-[0.97] ${
                    inList
                      ? "bg-white text-black"
                      : "bg-white/[0.12] hover:bg-white/[0.18] text-white backdrop-blur-md"
                  }`}
                >
                  {inList ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    /* List-plus icon (+≡) matching pathe_movie_page.png */
                    <svg className="h-3.5 w-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24">
                      <path d="M3 6h6M6 3v6M13 6h8M3 12h18M3 18h18" strokeLinecap="round" />
                    </svg>
                  )}
                  <span>Ma liste</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsLiked(!isLiked)}
                  className={`inline-flex items-center gap-2 rounded-[6px] px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer active:scale-[0.97] ${
                    isLiked
                      ? "bg-[#ffc61a] text-black"
                      : "bg-white/[0.12] hover:bg-white/[0.18] text-white backdrop-blur-md"
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>Noter</span>
                </button>
              </div>

              {/* Likes, Age Rating, Duration & Genres Line */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white font-bold pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <ThumbsUp className="h-3.5 w-3.5 fill-white text-white" />
                  <span>{isLiked ? "9 ont aimé" : "8 ont aimé"}</span>
                </span>
                <span className="text-neutral-400">•</span>
                <span>
                  {movie.ageRating === "16+"
                    ? "Interdit aux moins de 16 ans"
                    : movie.ageRating === "12+"
                    ? "Interdit aux moins de 12 ans"
                    : "Interdit aux moins de 12 ans"}
                </span>
                <span className="text-neutral-400">•</span>
                <span>{displayDuration}</span>
                <span className="text-neutral-400">•</span>
                <span>
                  {movie.genres && movie.genres.length > 0
                    ? movie.genres.join(" / ")
                    : "Epouvante - Horreur / Thriller"}
                </span>
              </div>

              {/* Release Date & Cast */}
              <div className="space-y-1.5 text-xs text-[#b3b3b3] pt-0.5 leading-relaxed">
                <p>Sortie : 21 oct. 2026</p>
                <p className="max-w-lg leading-snug">
                  <span>avec </span>
                  <span className="font-bold text-white">
                    {movie.cast && movie.cast.length > 0
                      ? movie.cast.join(", ")
                      : "Max Minghella, Naomi Ackie, Eddie Marsan, Tom Rhys Harries, David Dencik, Nancy Carroll, Joshua James"}
                  </span>
                  <span> de </span>
                  <span className="font-bold text-white">
                    {movie.director && movie.director !== "Official Studio Release"
                      ? movie.director
                      : "James Watkins"}
                  </span>
                </p>
              </div>

              {/* Synopsis */}
              <p className="text-xs text-[#d4d4d4] leading-relaxed max-w-lg line-clamp-2">
                {movie.synopsis}
              </p>

              {/* Infos, vidéos & détails › */}
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => setVideoModalOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-white hover:text-[#ffc61a] transition-colors cursor-pointer"
                >
                  <span>Infos, vidéos &amp; détails</span>
                  <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Right Column: Rounded-Square Frosted Play Button floating over the Backdrop */}
            <div className="lg:col-span-5 flex items-center justify-center min-h-[180px] sm:min-h-[240px]">
              <button
                type="button"
                onClick={() => setVideoModalOpen(true)}
                aria-label="Lire la bande-annonce"
                className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-[#382d29]/75 hover:bg-[#4c3e39]/90 backdrop-blur-md text-white shadow-2xl active:scale-95 transition-transform duration-150 cursor-pointer"
              >
                <Play className="h-6 w-6 fill-white text-white ml-0.5" />
              </button>
            </div>
          </div>

          {/* =========================================================================
              DATE PICKER STRIP (Filtres, <, Aujourd'hui, Demain, Days..., >, Calendrier)
              Matches pathe_movie_page.png 1:1
             ========================================================================= */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            {/* Filtres Card */}
            <button
              type="button"
              className="flex flex-col items-center justify-center gap-1.5 h-[66px] w-[86px] rounded-[6px] bg-[#2c2825]/90 hover:bg-[#36312d] text-xs font-semibold text-neutral-200 shrink-0 active:scale-[0.97] transition-all cursor-pointer"
            >
              <SlidersHorizontal className="h-4 w-4 text-neutral-300" />
              <span className="text-[11px]">Filtres</span>
            </button>

            {/* Left Narrow Scroll Arrow */}
            <button
              type="button"
              onClick={() => setSelectedDayIndex((prev) => Math.max(0, prev - 1))}
              aria-label="Jour précédent"
              className="flex items-center justify-center h-[66px] w-[26px] rounded-[6px] bg-[#2c2825]/90 hover:bg-[#36312d] text-neutral-300 hover:text-white shrink-0 active:scale-[0.95] transition-all cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {/* Day Cards */}
            <div className="flex flex-1 items-center gap-2">
              {days.map((day, idx) => {
                const isSelected = selectedDayIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`flex-1 min-w-[90px] h-[66px] rounded-[6px] flex flex-col items-center justify-center transition-all shrink-0 cursor-pointer active:scale-[0.97] ${
                      isSelected
                        ? "border border-white/80 bg-[#322e2a] text-white shadow-sm"
                        : "border border-transparent bg-[#2c2825]/90 hover:bg-[#35302c] text-[#a3a3a3]"
                    }`}
                  >
                    {day.isRelative ? (
                      <span className={`text-xs font-bold ${isSelected ? "text-white" : "text-neutral-200"}`}>
                        {day.label}
                      </span>
                    ) : (
                      <>
                        <span className="text-[10px] uppercase font-bold text-[#a3a3a3] leading-tight">
                          {day.dayCode}
                        </span>
                        <span className="text-[15px] font-extrabold text-white leading-tight my-0.5">
                          {day.dayNum}
                        </span>
                        <span className="text-[9.5px] uppercase font-semibold text-[#a3a3a3] leading-tight">
                          {day.monthCode}
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right Narrow Scroll Arrow */}
            <button
              type="button"
              onClick={() => setSelectedDayIndex((prev) => Math.min(days.length - 1, prev + 1))}
              aria-label="Jour suivant"
              className="flex items-center justify-center h-[66px] w-[26px] rounded-[6px] bg-[#2c2825]/90 hover:bg-[#36312d] text-neutral-300 hover:text-white shrink-0 active:scale-[0.95] transition-all cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            {/* Calendrier Card */}
            <button
              type="button"
              className="flex flex-col items-center justify-center gap-1.5 h-[66px] w-[92px] rounded-[6px] bg-[#2c2825]/90 hover:bg-[#36312d] text-xs font-semibold text-neutral-200 shrink-0 active:scale-[0.97] transition-all cursor-pointer"
            >
              <Calendar className="h-4 w-4 text-neutral-300" />
              <span className="text-[11px]">Calendrier</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CINEMA & 6-COLUMN SHOWTIMES GRID (Matches pathe_movie_page.png 1:1)
         ========================================================================= */}
      <section className="py-10 bg-[#0d0d0d]">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12 space-y-5">
          {/* Cinema Header */}
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => setIsFavoriteCinema(!isFavoriteCinema)}
              aria-label="Ajouter aux cinémas favoris"
              className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-[#1c1c1c] hover:bg-[#262626] border border-white/[0.06] text-neutral-300 active:scale-[0.94] transition-all cursor-pointer shrink-0"
            >
              {/* Heart-plus icon matching pathe_movie_page.png */}
              <svg
                className={`h-4 w-4 ${isFavoriteCinema ? "text-[#ffc61a] fill-[#ffc61a]" : "text-neutral-300"}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </button>

            <div>
              <Link href="/cinemas" className="group inline-flex items-center gap-1">
                <h2 className="text-[15px] font-bold text-white group-hover:text-[#ffc61a] transition-colors">
                  Pathé Californie
                </h2>
                <ChevronRight className="h-3.5 w-3.5 text-white stroke-[2.5]" />
              </Link>
              <p className="text-xs text-[#8c8c8c]">
                Casablanca CT 1029 Aïn Chock
              </p>
            </div>
          </div>

          {/* 6-Slot Showtimes Row (3 active sessions + 3 subtle dark slots as in pathe_movie_page.png) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {showtimesList.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => handleOpenDrawer(session)}
                className="group relative flex flex-col justify-between h-[88px] rounded-[6px] border border-white/[0.08] bg-[#1a1a1a] hover:bg-[#242424] hover:border-white/25 p-3 active:scale-[0.98] transition-all duration-150 cursor-pointer text-left"
              >
                {/* Top Row: Format Badge (4DX) or Empty */}
                <div>
                  {session.format === "4DX" && (
                    <span className="inline-flex items-center rounded-[2px] bg-white/85 px-1.5 py-[1px] text-[10px] font-black uppercase tracking-tighter text-[#0a0a0a]">
                      4DX
                    </span>
                  )}
                </div>

                {/* Bottom Row: Time + Stacked VOSTFR / EndTime + Wheelchair Icon */}
                <div className="flex items-end justify-between w-full">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-[30px] leading-none font-extrabold text-white tracking-tight group-hover:text-[#ffc61a] transition-colors">
                      {session.time}
                    </span>
                    <div className="flex flex-col leading-none">
                      <span className="text-[10px] font-bold text-neutral-200 uppercase">
                        {session.language}
                      </span>
                      <span className="text-[9.5px] font-medium text-[#8c8c8c] mt-0.5">
                        →{session.endTime}
                      </span>
                    </div>
                  </div>

                  <Accessibility className="h-3.5 w-3.5 text-[#8c8c8c] shrink-0 mb-0.5" />
                </div>
              </button>
            ))}

            {/* 3 Empty Showtime Slots matching pathe_movie_page.png & pathe_booking_01.jpeg */}
            {[1, 2, 3].map((slot) => (
              <div
                key={`empty-slot-${slot}`}
                className="hidden lg:block h-[88px] rounded-[6px] border border-white/[0.04] bg-white/[0.015]"
              />
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SLIDE-OVER SESSION DRAWER (Matches pathe_booking_01.jpeg 1:1)
         ========================================================================= */}
      {activeDrawerSession && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Dimmed Page Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 transition-opacity"
            onClick={() => setActiveDrawerSession(null)}
          />

          {/* Pure Black Right Drawer */}
          <div className="relative z-10 w-full sm:w-[440px] bg-black text-white h-full flex flex-col overflow-y-auto shadow-2xl border-l border-white/[0.08]">
            {/* Top Header */}
            <div className="flex items-center justify-between px-5 py-4 z-20">
              <div className="flex items-center gap-3">
                <div className="h-9 w-7 rounded-[3px] overflow-hidden bg-neutral-900 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-black text-xs text-white uppercase tracking-tight leading-tight">
                    {movie.title}
                  </h3>
                  <p className="text-[11px] text-neutral-300 leading-tight mt-0.5">
                    Pathé Californie
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveDrawerSession(null)}
                aria-label="Fermer"
                className="p-1.5 text-white hover:text-neutral-300 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Backdrop Section with Centered Date, Giant Time & Hall Details */}
            <div className="relative px-6 py-8 text-center overflow-hidden">
              {/* Background movie image with dark vignette fade */}
              <div className="absolute inset-0 z-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={movie.backdrop || movie.poster}
                  alt=""
                  className="h-full w-full object-cover opacity-35"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, #000000 0%, rgba(0,0,0,0.35) 50%, #000000 100%)",
                  }}
                />
              </div>

              <div className="relative z-10 space-y-3">
                <p className="font-display text-base font-extrabold text-white uppercase tracking-wide">
                  {activeDrawerSession.fullDate}
                </p>

                {/* Centered Giant Time + VOSTFR / EndTime */}
                <div className="flex items-baseline justify-center gap-2 py-1">
                  <span className="font-display text-6xl sm:text-[64px] leading-none font-black text-white tracking-tight">
                    {activeDrawerSession.time}
                  </span>
                  <div className="flex flex-col text-left leading-tight">
                    <span className="text-xs font-bold text-white uppercase">
                      {activeDrawerSession.language}
                    </span>
                    <span className="text-[11px] font-medium text-neutral-400">
                      →{activeDrawerSession.endTime}
                    </span>
                  </div>
                </div>

                <div className="pt-2 space-y-1">
                  <h4 className="font-display text-base font-extrabold text-white uppercase tracking-wider">
                    PATHÉ CALIFORNIE
                  </h4>
                  <p className="text-xs text-neutral-300 flex items-center justify-center gap-1.5">
                    <span>{activeDrawerSession.hall}</span>
                    <Accessibility className="h-3.5 w-3.5 text-neutral-300" />
                    <span>•</span>
                    <span>
                      Durée : {displayDuration} - Fin prévue à {activeDrawerSession.endTime}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Yellow CTA Button + Capacity & PMR Rows immediately below */}
            <div className="px-5 pt-2">
              <button
                type="button"
                onClick={handleConfirmBooking}
                className="w-full inline-flex items-center justify-center gap-2 rounded-[6px] bg-[#ffc61a] hover:bg-[#ffd147] py-3.5 text-xs sm:text-[13px] font-bold text-[#0a0a0a] active:scale-[0.98] transition-transform duration-150 cursor-pointer"
              >
                <svg
                  className="h-4 w-4 text-[#0a0a0a] -rotate-45"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                  <path d="M13 5v2M13 17v2M13 11v2" />
                </svg>
                <span>Réserver maintenant</span>
              </button>

              {/* Specs Rows matching pathe_booking_01.jpeg */}
              <div className="mt-6 divide-y divide-white/15 border-b border-white/15 text-xs text-white">
                <div className="flex items-center justify-between py-3.5">
                  <span>Capacité de {activeDrawerSession.capacity} places</span>
                  {/* Sofa/Armchair SVG Icon */}
                  <svg
                    className="h-4 w-4 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M4 11V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3" />
                    <path d="M2 11h2v5h16v-5h2v7H2v-7Z" />
                    <path d="M4 18v2M20 18v2" />
                  </svg>
                </div>
                <div className="flex items-center justify-between py-3.5">
                  <span>PMR</span>
                  <Accessibility className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setVideoModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-3xl rounded-2xl border border-white/10 bg-[#141416] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Bande-annonce · {movie.title}</h3>
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black relative flex items-center justify-center border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={movie.backdrop || movie.poster}
                alt={movie.title}
                className="h-full w-full object-cover opacity-50"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="h-14 w-14 rounded-full bg-[#ffc61a] text-black flex items-center justify-center shadow-lg">
                  <Play className="h-6 w-6 fill-black text-black ml-0.5" />
                </div>
                <p className="text-xs font-bold text-white">Bande-annonce officielle ({displayDuration})</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <CinemaFAQ />
    </div>
  );
}
