"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { FormattedMovie } from "@/lib/tmdb";
import { MovieCard } from "./movie-card";
import { SectionHeader } from "./section-header";

interface MovieCarouselProps {
  title: string;
  cinemaName?: string;
  stackCinemaBelow?: boolean;
  showProgress?: boolean;
  onCinemaClick?: () => void;
  movies: FormattedMovie[];
  badgeType?: "nouveau" | "en-vente" | "none";
  badgeLimit?: number;
  isRanked?: boolean;
}

export function MovieCarousel({
  title,
  cinemaName,
  stackCinemaBelow = false,
  showProgress = true,
  onCinemaClick,
  movies,
  badgeType = "none",
  badgeLimit,
  isRanked = false,
}: MovieCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) {
      setScrollProgress(0);
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    setScrollProgress(scrollLeft / maxScroll);
    setCanScrollLeft(scrollLeft > 16);
    setCanScrollRight(scrollLeft < maxScroll - 16);
  };

  useEffect(() => {
    updateScrollState();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", updateScrollState, { passive: true });
      return () => container.removeEventListener("scroll", updateScrollState);
    }
  }, [movies]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const offset = direction === "left" ? -520 : 520;
    scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  if (!movies || movies.length === 0) return null;

  return (
    <section className="py-5 relative">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12">
        {/* Section Header with Cinema Selector and Segmented Scroll Progress */}
        <SectionHeader
          title={title}
          cinemaName={cinemaName}
          stackCinemaBelow={stackCinemaBelow}
          showProgress={showProgress}
          onCinemaClick={onCinemaClick}
          scrollProgress={scrollProgress}
        />

        {/* Carousel Container */}
        <div className="relative">
          {/* Left Vertical Rectangular Arrow Button */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Défiler vers la gauche"
              className="absolute left-1 top-[38%] -translate-y-1/2 z-20 hidden sm:flex h-11 w-8 items-center justify-center rounded-[6px] bg-[#453f34]/85 hover:bg-[#575043] backdrop-blur-md text-white shadow-xl active:scale-[0.94] transition-transform duration-150 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
            </button>
          )}

          {/* Right Vertical Rectangular Arrow Button matching pathe_home.png */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Défiler vers la droite"
              className="absolute right-1 top-[38%] -translate-y-1/2 z-20 flex h-11 w-8 items-center justify-center rounded-[6px] bg-[#453f34]/85 hover:bg-[#575043] backdrop-blur-md text-white shadow-xl active:scale-[0.94] transition-transform duration-150 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4 stroke-[2.5]" />
            </button>
          )}

          {/* Cards Scroll Row */}
          <div
            ref={scrollContainerRef}
            className={`flex items-start overflow-x-auto scrollbar-none scroll-smooth pb-2 pt-0.5 ${
              isRanked ? "gap-6 sm:gap-8" : "gap-3 sm:gap-3.5"
            }`}
          >
            {movies.map((movie, index) => {
              const shouldShowBadge =
                badgeType !== "none" &&
                (badgeLimit === undefined ? true : index < badgeLimit);

              return (
                <MovieCard
                  key={`${movie.tmdbId || movie.slug}-${index}`}
                  movie={movie}
                  badgeType={badgeType}
                  showBadge={shouldShowBadge}
                  rank={isRanked ? index + 1 : undefined}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
