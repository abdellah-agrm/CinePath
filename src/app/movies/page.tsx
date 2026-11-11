"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Loader2, Film } from "lucide-react";

interface MovieItem {
  id: string;
  slug: string;
  title: string;
  rating: string;
  ageRating: string;
  duration: string;
  genres: string[];
  formats: string[];
  language: string;
  fromPrice: number;
  poster: string;
}

export default function MoviesCatalogPage() {
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("ALL");
  const [selectedFormat, setSelectedFormat] = useState("ALL");

  useEffect(() => {
    async function loadMovies() {
      try {
        setLoading(true);
        const url = new URL("/api/movies", window.location.origin);
        if (selectedGenre !== "ALL") url.searchParams.set("genre", selectedGenre);
        if (searchQuery.trim()) url.searchParams.set("search", searchQuery.trim());

        const res = await fetch(url.toString());
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setMovies(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch movies from API:", err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadMovies();
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedGenre]);

  const filtered = movies.filter((m) => {
    if (selectedFormat !== "ALL" && !m.formats?.includes(selectedFormat)) {
      return false;
    }
    return true;
  });

  const getFrenchAgeLabel = (rating?: string) => {
    if (!rating) return { circle: null, text: "Tout public" };
    if (rating.includes("16")) return { circle: "16", text: "Interdit aux moins de 16 ans" };
    if (rating.includes("12") || rating.includes("14")) {
      return { circle: "12", text: "Interdit aux moins de 12 ans" };
    }
    return { circle: null, text: "Tout public" };
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-28 sm:pt-36 pb-20">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12">
        {/* Page Header & Search Bar matching pathe.ma/fr */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Tous les films à l&apos;affiche
            </h1>
            <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
              au Pathé Californie · Réservez vos places en IMAX, 4DX et Dolby Atmos
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Rechercher un film, un genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-[8px] border border-white/10 bg-[#1a1a1a] pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-[#8c8c8c] focus:outline-none focus:border-[#ffc61a] transition-colors"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#8c8c8c]" />
          </div>
        </div>

        {/* Filter Pills Strip */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-8 text-xs">
          <div className="flex items-center gap-1.5 rounded-[6px] bg-[#2c2825] px-3.5 py-2 text-neutral-200 font-semibold shrink-0">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filtres</span>
          </div>

          {[
            { label: "Tous les films", value: "ALL" },
            { label: "Action", value: "Action" },
            { label: "Aventure", value: "Aventure" },
            { label: "Science-Fiction", value: "Science-Fiction" },
            { label: "Drame", value: "Drame" },
            { label: "Animation", value: "Animation" },
            { label: "Comédie", value: "Comédie" },
            { label: "Epouvante - Horreur", value: "Epouvante - Horreur" },
            { label: "Thriller", value: "Thriller" },
          ].map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setSelectedGenre(g.value)}
              className={`rounded-[6px] px-3.5 py-2 font-bold transition-colors shrink-0 cursor-pointer active:scale-[0.97] ${
                selectedGenre === g.value
                  ? "border border-white/80 bg-[#322e2a] text-white"
                  : "bg-[#1a1a1a] hover:bg-[#252525] text-[#a3a3a3] hover:text-white"
              }`}
            >
              {g.label}
            </button>
          ))}

          <div className="h-5 w-[1px] bg-white/10 mx-1 shrink-0" />

          {["ALL", "IMAX", "2D"].map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => setSelectedFormat(fmt)}
              className={`rounded-[6px] px-3.5 py-2 font-bold transition-colors shrink-0 cursor-pointer active:scale-[0.97] ${
                selectedFormat === fmt
                  ? "bg-[#ffc61a] text-[#0a0a0a]"
                  : "bg-[#1a1a1a] hover:bg-[#252525] text-[#a3a3a3] hover:text-white"
              }`}
            >
              {fmt === "ALL" ? "Tous les formats" : fmt}
            </button>
          ))}
        </div>

        {/* Movies Poster Grid matching pathe_home.png poster style */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-[#8c8c8c] gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#ffc61a]" />
            <p className="text-xs font-bold uppercase tracking-wider">
              Chargement de la programmation Pathé...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center rounded-xl border border-white/[0.08] bg-[#141414] p-12">
            <Film className="mx-auto h-10 w-10 text-neutral-600 mb-3" />
            <p className="text-sm font-semibold text-neutral-300">
              Aucun film ne correspond à votre recherche.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-x-4 gap-y-8">
            {filtered.map((movie, idx) => {
              const ageInfo = getFrenchAgeLabel(movie.ageRating);
              return (
                <Link
                  key={movie.id}
                  href={`/movies/${movie.slug}`}
                  className="group block select-none cursor-pointer active:scale-[0.98] transition-transform duration-150"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[4px] bg-[#161616] shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                    {idx < 5 && (
                      <div className="absolute top-2 right-2 z-10">
                        <span className="inline-block rounded-[3px] bg-[#e51923] px-2 py-0.5 text-[11px] font-bold text-white shadow-sm leading-tight">
                          Nouveau
                        </span>
                      </div>
                    )}
                  </div>

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
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
