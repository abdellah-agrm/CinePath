"use client";

import Link from "next/link";
import { Plus, Check } from "lucide-react";
import { useState } from "react";

export interface HeroMovieData {
  title: string;
  slug: string;
  backdropUrl?: string;
  posterUrl?: string;
  format?: string;
  tagline?: string;
  overview?: string;
}

interface HeroBillboardProps {
  movie: HeroMovieData;
  cinemaName?: string;
}

export function HeroBillboard({ movie }: HeroBillboardProps) {
  const [inList, setInList] = useState(false);

  const heroImage = movie.backdropUrl || movie.posterUrl || "/posters/placeholder.jpg";

  return (
    <section className="relative min-h-[540px] sm:min-h-[640px] lg:min-h-[760px] flex items-center overflow-hidden bg-[#0a0a0a]">
      {/* Background Hero Artwork with Directional Vignettes matching pathe_home.png */}
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImage}
          alt={movie.title}
          className="h-full w-full object-cover object-center sm:object-[65%_20%] opacity-95"
        />

        {/* Directional Vignettes: Deep dark on left for title/CTA block, vivid artwork on right */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #0a0a0a 0%, rgba(10,10,10,0.88) 32%, rgba(10,10,10,0.25) 62%, rgba(10,10,10,0.05) 100%)",
          }}
        />

        {/* Bottom blend into carousel rows */}
        <div
          className="absolute bottom-0 inset-x-0 h-48"
          style={{
            background:
              "linear-gradient(0deg, #0a0a0a 0%, rgba(10,10,10,0.8) 45%, transparent 100%)",
          }}
        />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 sm:px-8 lg:px-12 pt-28 sm:pt-36 pb-12">
        <div className="w-full max-w-[460px] flex flex-col items-center text-center space-y-6">
          {/* Stylized Movie Title Logo Typography */}
          <h1 className="font-display text-5xl sm:text-6xl lg:text-[72px] font-black uppercase tracking-[0.01em] text-white leading-[0.9] drop-shadow-[0_8px_24px_rgba(0,0,0,0.9)] select-none">
            {movie.title}
          </h1>

          {/* Action CTAs: Two equal-height rounded-[8px] buttons side-by-side */}
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-3 w-full">
            {/* Primary Yellow Booking CTA */}
            <Link
              href={`/movies/${movie.slug}`}
              className="flex-1 min-w-[205px] h-11 inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#ffc61a] hover:bg-[#ffd147] px-5 text-[13px] font-bold text-[#0a0a0a] active:scale-[0.97] transition-transform duration-150 cursor-pointer shadow-lg shadow-black/40"
            >
              {/* Tilted Ticket Outline Icon matching pathe_home.png */}
              <svg
                className="h-4 w-4 text-[#0a0a0a] shrink-0 -rotate-45"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                <path d="M13 5v2" />
                <path d="M13 17v2" />
                <path d="M13 11v2" />
              </svg>
              <span>Réserver maintenant</span>
            </Link>

            {/* Secondary Dark Translucent CTA (+ Ma liste) */}
            <button
              type="button"
              onClick={() => setInList(!inList)}
              className="flex-1 min-w-[180px] h-11 inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#2c323b]/80 hover:bg-[#383f4a]/90 backdrop-blur-md border border-white/[0.08] px-5 text-[13px] font-bold text-white active:scale-[0.97] transition-transform duration-150 cursor-pointer"
            >
              {inList ? (
                <>
                  <Check className="h-4 w-4 text-[#ffc61a]" />
                  <span>Dans ma liste</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  <span>Ma liste</span>
                </>
              )}
            </button>
          </div>

          {/* Centered Format Badge ("En IMAX") directly under the two buttons */}
          <div className="flex items-center justify-center gap-2.5 pt-0.5 text-xs">
            <span className="text-neutral-300 font-medium text-[12px]">En</span>
            <span className="tracking-[0.14em] uppercase font-black text-white text-[14px]">
              {movie.format || "IMAX"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
