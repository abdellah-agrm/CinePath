"use client";

import { useState } from "react";
import { FormattedMovie } from "@/lib/tmdb";
import { HeroBillboard } from "./hero-billboard";
import { MovieCarousel } from "./movie-carousel";
import { CinemaSelectorModal, CINEMAS, CinemaOption } from "./cinema-selector-modal";

interface HomeCinemaViewProps {
  movies: FormattedMovie[];
}

export function HomeCinemaView({ movies }: HomeCinemaViewProps) {
  const [selectedCinema, setSelectedCinema] = useState<CinemaOption>(CINEMAS[0]);
  const [modalOpen, setModalOpen] = useState(false);

  const featured = movies.length > 0 ? movies[0] : null;

  // Split movies into authentic Pathé sections matching pathe_home.png
  const nowPlaying = movies.slice(0, 10);
  const previews = movies.slice(3, 8);
  const mostAnticipated = movies.slice(0, 6);
  const upcoming = movies.slice(1, 10);

  const cinemaLabel = `au ${selectedCinema.name}`;

  return (
    <div className="bg-[#0a0a0a] pb-6">
      {/* 1. Hero Billboard */}
      {featured && (
        <HeroBillboard
          movie={{
            title: featured.title,
            slug: featured.slug,
            backdropUrl: featured.backdropUrl || featured.posterUrl,
            format: "IMAX",
          }}
          cinemaName={selectedCinema.name}
        />
      )}

      {/* 2. Carousel 1: À l'affiche au cinéma (first 5 have "Nouveau" red badge as in pathe_home.png) */}
      <MovieCarousel
        title="À l'affiche au cinéma"
        cinemaName={cinemaLabel}
        showProgress={true}
        onCinemaClick={() => setModalOpen(true)}
        movies={nowPlaying}
        badgeType="nouveau"
        badgeLimit={5}
      />

      {/* 3. Carousel 2: Avant-premières et préventes (5 items, no progress indicator) */}
      <MovieCarousel
        title="Avant-premières et préventes"
        cinemaName={cinemaLabel}
        showProgress={false}
        onCinemaClick={() => setModalOpen(true)}
        movies={previews}
        badgeType="none"
      />

      {/* 4. Carousel 3: Les plus attendus (stacked cinema subtitle, giant gold outline numbers 1..6) */}
      <div id="les-plus-attendus">
        <MovieCarousel
          title="Les plus attendus"
          cinemaName={cinemaLabel}
          stackCinemaBelow={true}
          showProgress={true}
          onCinemaClick={() => setModalOpen(true)}
          movies={mostAnticipated}
          isRanked={true}
        />
      </div>

      {/* 5. Carousel 4: Prochaines sorties au cinéma (with "En vente !" badges) */}
      <MovieCarousel
        title="Prochaines sorties au cinéma"
        showProgress={true}
        movies={upcoming}
        badgeType="en-vente"
        badgeLimit={6}
      />

      {/* Cinema Selector Modal */}
      <CinemaSelectorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedCinemaId={selectedCinema.id}
        onSelectCinema={(cinema) => setSelectedCinema(cinema)}
      />
    </div>
  );
}
