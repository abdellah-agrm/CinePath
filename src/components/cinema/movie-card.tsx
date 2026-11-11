"use client";

import Link from "next/link";
import { FormattedMovie } from "@/lib/tmdb";

interface MovieCardProps {
  movie: FormattedMovie;
  badgeType?: "nouveau" | "en-vente" | "none";
  rank?: number;
  showBadge?: boolean;
}

export function MovieCard({
  movie,
  badgeType = "none",
  rank,
  showBadge = true,
}: MovieCardProps) {
  const posterSrc = movie.posterUrl || "/posters/placeholder.jpg";

  const formatAgeLabel = (rating?: string) => {
    if (!rating) return { circle: null, text: "Tout public" };
    if (rating === "16+" || rating.includes("16")) {
      return { circle: "16", text: "Interdit aux moins de 16 ans" };
    }
    if (rating === "12+" || rating.includes("12") || rating === "14+") {
      return { circle: "12", text: "Interdit aux moins de 12 ans" };
    }
    if (rating === "TBC" || rating === "To be confirmed") {
      return { circle: null, text: "To be confirmed" };
    }
    return { circle: null, text: "Tout public" };
  };

  const ageInfo = formatAgeLabel(movie.ageRating);

  const formattedReleaseDate = movie.releaseDate
    ? new Date(movie.releaseDate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "16 déc. 2026";

  return (
    <Link
      href={`/movies/${movie.slug}`}
      className="group block shrink-0 select-none cursor-pointer outline-none active:scale-[0.98] transition-transform duration-150"
    >
      <div className="flex items-end">
        {/* Giant Thin Gold Outline Rank Number for 'Les plus attendus' matching pathe_home.png */}
        {rank !== undefined && (
          <span
            className="font-display text-[110px] sm:text-[134px] font-semibold leading-[0.78] text-transparent select-none -mr-1.5 mb-6 tracking-tight shrink-0"
            style={{
              WebkitTextStroke: "1.35px #a88225",
            }}
          >
            {rank}
          </span>
        )}

        {/* Poster Container */}
        <div className={rank !== undefined ? "w-[146px] sm:w-[158px]" : "w-[150px] sm:w-[164px]"}>
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[4px] bg-[#161616] shadow-md">
            {/* Poster Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={posterSrc}
              alt={movie.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            />

            {/* Corner Badge: Sentence-case "Nouveau" or "En vente !" matching pathe_home.png */}
            {showBadge && badgeType === "nouveau" && (
              <div className="absolute top-2 right-2 z-10">
                <span className="inline-block rounded-[3px] bg-[#e51923] px-2 py-0.5 text-[11px] font-bold text-white shadow-sm leading-tight">
                  Nouveau
                </span>
              </div>
            )}

            {showBadge && badgeType === "en-vente" && (
              <div className="absolute top-2 right-2 z-10">
                <span className="inline-block rounded-[3px] bg-[#ffc61a] px-2 py-0.5 text-[11px] font-bold text-[#0a0a0a] shadow-sm leading-tight">
                  En vente !
                </span>
              </div>
            )}
          </div>

          {/* Under-poster Metadata matching pathe_home.png */}
          <div className="pt-2 space-y-0.5">
            <h3 className="text-[12.5px] font-medium text-white group-hover:text-[#ffc61a] transition-colors leading-snug line-clamp-2">
              {movie.title}
            </h3>

            <p className="text-[11.5px] text-[#8c8c8c] leading-snug flex items-center gap-1 truncate">
              {ageInfo.circle && (
                <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/20 text-[8px] font-bold text-neutral-300 shrink-0">
                  {ageInfo.circle}
                </span>
              )}
              <span className="truncate">{ageInfo.text}</span>
            </p>

            {rank !== undefined && (
              <p className="text-[11.5px] text-[#9ca3af] pt-0.5">
                {formattedReleaseDate}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
