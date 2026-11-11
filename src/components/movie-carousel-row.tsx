"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronRight as ArrowLink } from "lucide-react";
import { FormattedMovie } from "@/lib/tmdb";

interface MovieCarouselRowProps {
  title: string;
  subtitle?: string;
  href?: string;
  movies: FormattedMovie[];
  badgeType?: "nouveau" | "en-vente" | "none";
  isRanked?: boolean;
}

export function MovieCarouselRow({
  title,
  subtitle = "au Pathé Californie",
  href = "/movies",
  movies,
  badgeType = "none",
  isRanked = false,
}: MovieCarouselRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -400 : 400;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <section className="py-6 sm:py-8 border-b border-white/[0.04]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <Link href={href} className="group inline-flex items-center gap-1.5">
            <h2 className="text-lg sm:text-xl font-black text-white group-hover:text-amber-400 transition-colors tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <span className="text-xs sm:text-sm font-semibold text-neutral-400 group-hover:text-white transition-colors">
                › {subtitle} ›
              </span>
            )}
          </Link>

          {/* Carousel Arrows */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Faire défiler vers la gauche"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 active:scale-[0.92] transition-all cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Faire défiler vers la droite"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 active:scale-[0.92] transition-all cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Posters Row */}
        <div
          ref={scrollRef}
          className="flex items-start gap-4 overflow-x-auto scrollbar-none pb-2 pt-1 scroll-smooth"
        >
          {movies.map((movie, idx) => (
            <Link
              key={`${movie.slug}-${idx}`}
              href={`/movies/${movie.slug}`}
              className="group shrink-0 flex flex-col active:scale-[0.98] transition-transform"
              style={{ width: isRanked ? "210px" : "154px" }}
            >
              <div className="flex items-end">
                {/* Big Number for Ranked Section */}
                {isRanked && (
                  <span
                    className="font-black text-6xl sm:text-7xl leading-none text-transparent tracking-tighter mr-2 select-none shrink-0"
                    style={{
                      WebkitTextStroke: "2px #feca00",
                      textShadow: "0 4px 20px rgba(254, 202, 0, 0.25)",
                    }}
                  >
                    {idx + 1}
                  </span>
                )}

                {/* Poster Box */}
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-neutral-900 border border-white/10 shadow-lg group-hover:border-amber-400/60 transition-all duration-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Corner Badge */}
                  {badgeType === "nouveau" && (
                    <div className="absolute top-2 right-2 rounded-md bg-red-600 px-1.5 py-0.5 text-[9px] font-black uppercase text-white shadow-md tracking-wider">
                      Nouveau
                    </div>
                  )}

                  {badgeType === "en-vente" && (
                    <div className="absolute top-2 right-2 rounded-md bg-amber-400 px-1.5 py-0.5 text-[9px] font-black uppercase text-black shadow-md tracking-wider">
                      En vente !
                    </div>
                  )}
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="mt-2.5 space-y-0.5">
                <h3 className="font-bold text-xs text-white group-hover:text-amber-400 transition-colors line-clamp-1 leading-snug">
                  {movie.title}
                </h3>
                <p className="text-[10px] text-neutral-400 font-medium line-clamp-1">
                  {movie.ageRating === "16+"
                    ? "Interdit aux moins de 16 ans"
                    : movie.ageRating === "12+"
                    ? "Interdit aux moins de 12 ans"
                    : "Tout public"}
                </p>
                {isRanked && (
                  <p className="text-[10px] font-semibold text-amber-400">
                    {new Date(movie.releaseDate).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

