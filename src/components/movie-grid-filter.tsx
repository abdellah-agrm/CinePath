"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Calendar, ChevronRight, Star, Film, Sparkles, Clock } from "lucide-react";
import { FormattedMovie } from "@/lib/tmdb";
import { formatPrice } from "@/lib/utils";

interface MovieGridFilterProps {
  initialMovies: FormattedMovie[];
}

type FilterType = "ALL" | "TODAY" | "TOMORROW" | "IMAX" | "3D" | "VOSTFR";

export function MovieGridFilter({ initialMovies }: MovieGridFilterProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");

  const filterOptions: { id: FilterType; label: string; badge?: string }[] = [
    { id: "ALL", label: "All Movies" },
    { id: "TODAY", label: "Today" },
    { id: "TOMORROW", label: "Tomorrow" },
    { id: "IMAX", label: "IMAX Laser", badge: "Premium" },
    { id: "3D", label: "RealD 3D" },
    { id: "VOSTFR", label: "Original Version (VOST)" },
  ];

  const filteredMovies = useMemo(() => {
    switch (activeFilter) {
      case "IMAX":
        return initialMovies.filter(
          (m) =>
            m.genres.some((g) =>
              ["Action", "Adventure", "Science Fiction", "Sci-Fi", "Fantasy"].includes(g)
            ) || m.rating >= 7.5
        );
      case "3D":
        return initialMovies.filter((m) =>
          m.genres.some((g) => ["Animation", "Action", "Adventure", "Fantasy"].includes(g))
        );
      case "VOSTFR":
        return initialMovies.filter((m) => m.originalLanguage === "en" || !m.originalLanguage);
      case "TODAY":
      case "TOMORROW":
      case "ALL":
      default:
        return initialMovies;
    }
  }, [initialMovies, activeFilter]);

  return (
    <>
      {/* Quick Filter Bar with Glassmorphic Sticky Header */}
      <section className="sticky top-16 z-40 border-b border-white/[0.08] bg-background/85 backdrop-blur-xl py-3.5 transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
              Filter Experience:
            </span>
            {filterOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setActiveFilter(opt.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold shrink-0 cursor-pointer active:scale-[0.97] transition-all ${
                  activeFilter === opt.id
                    ? "bg-[#feca00] text-black font-black shadow-md shadow-[#feca00]/20"
                    : "border border-white/[0.08] bg-card/60 text-muted-foreground hover:text-white hover:bg-card hover:border-white/20"
                }`}
              >
                <span>{opt.label}</span>
                {opt.badge && (
                  <span className="rounded bg-amber-400/20 px-1 py-0.2 text-[9px] font-bold text-amber-300 uppercase">
                    {opt.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="text-xs font-semibold text-neutral-400 shrink-0 hidden md:block">
            Showing <span className="text-white">{filteredMovies.length}</span> titles
          </div>
        </div>
      </section>

      {/* Now Showing Grid */}
      <section id="now-showing" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Live Theatrical Lineup
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Now Showing in Theatres
            </h2>
          </div>
          <Link
            href="/movies"
            className="group inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-rose-400 transition"
          >
            Full catalogue
            <ChevronRight className="h-4 w-4 transform transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Live Movie Cards from TMDB */}
        {filteredMovies.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-card/40 p-12 text-center backdrop-blur-sm">
            <Film className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No movies match the selected format filter.
            </p>
            <button
              onClick={() => setActiveFilter("ALL")}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 active:scale-[0.97] transition-all cursor-pointer"
            >
              Reset to all movies
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
            {filteredMovies.map((movie: FormattedMovie, idx: number) => (
              <Link
                key={movie.slug}
                href={`/movies/${movie.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-card/70 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/15 hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-200"
                style={{
                  animationDelay: `${idx * 40}ms`,
                }}
              >
                {/* Poster Container with Aspect Ratio */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Rating Badge */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full border border-black/40 bg-black/70 backdrop-blur-md px-2.5 py-0.5 text-xs font-bold text-amber-300 shadow-sm">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span>{movie.rating.toFixed(1)}</span>
                  </div>

                  {/* Age Rating Badge */}
                  <div className="absolute top-2.5 left-2.5 rounded-lg border border-white/20 bg-primary/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-wider shadow-sm">
                    {movie.ageRating}
                  </div>

                  {/* Format Indicator Pill Overlay on Hover */}
                  <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1 opacity-90 transition-opacity">
                    <span className="rounded bg-black/70 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold text-neutral-300 uppercase tracking-wider border border-white/10">
                      Laser 4K
                    </span>
                    {movie.durationMin > 130 && (
                      <span className="rounded bg-primary/80 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                        IMAX
                      </span>
                    )}
                  </div>
                </div>

                {/* Movie Details */}
                <div className="flex flex-1 flex-col justify-between p-4 bg-gradient-to-b from-card/80 to-card">
                  <div>
                    <h3 className="font-bold text-white group-hover:text-primary transition-colors line-clamp-1 text-base">
                      {movie.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1 font-medium">
                      {movie.genres.join(" · ")}
                    </p>
                    <p className="text-[11px] text-muted-foreground/80 mt-1.5 flex items-center gap-1 font-medium">
                      <Clock className="h-3 w-3 text-neutral-400" />
                      {Math.floor(movie.durationMin / 60)}h {movie.durationMin % 60}m
                    </p>
                  </div>

                  {/* Card Action & Pricing Footer */}
                  <div className="mt-4 flex items-center justify-between border-t border-white/[0.08] pt-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">From</span>
                      <span className="text-xs sm:text-sm font-bold text-white">{formatPrice(90)}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-xl bg-[#feca00] hover:bg-[#ffd633] px-3.5 py-1.5 text-xs font-black text-black shadow-md shadow-[#feca00]/20 active:scale-[0.95] transition-all">
                      <span>Reserve</span>
                      <ChevronRight className="h-3 w-3 stroke-[3]" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
