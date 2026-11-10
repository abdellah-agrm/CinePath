"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  LayoutGrid,
  List,
  Filter,
  Calendar,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedGenre]);

  const filtered = movies.filter((m) => {
    if (selectedFormat !== "ALL" && !m.formats?.includes(selectedFormat)) {
      return false;
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pb-24">
      {/* Page Title & Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Movies in Theatres
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Official catalog powered live by The Movie Database (TMDB) API
          </p>
        </div>

        {/* Search Input & View Toggle */}
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary pl-9"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>

          <div className="flex rounded-xl border border-border bg-card p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-lg p-1.5 transition ${
                viewMode === "grid"
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-white"
              }`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-lg p-1.5 transition ${
                viewMode === "list"
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-white"
              }`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-border/60 pb-4 text-xs">
        <span className="text-muted-foreground font-medium mr-2 flex items-center gap-1">
          <Filter className="h-3.5 w-3.5" /> Genre:
        </span>
        {["ALL", "Action", "Adventure", "Science Fiction", "Drama", "Animation", "Comedy"].map(
          (genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`rounded-full px-3 py-1 font-semibold transition ${
                selectedGenre === genre
                  ? "bg-primary text-white shadow-sm"
                  : "border border-border bg-card text-muted-foreground hover:text-white"
              }`}
            >
              {genre}
            </button>
          )
        )}

        <div className="hidden sm:block h-4 w-[1px] bg-border mx-2" />

        <span className="text-muted-foreground font-medium mr-2">Format:</span>
        {["ALL", "IMAX", "2D"].map((fmt) => (
          <button
            key={fmt}
            onClick={() => setSelectedFormat(fmt)}
            className={`rounded-full px-3 py-1 font-semibold transition ${
              selectedFormat === fmt
                ? "bg-muted text-white border border-border"
                : "border border-border/40 text-muted-foreground hover:text-white"
            }`}
          >
            {fmt}
          </button>
        ))}
      </div>

      {/* Movie Results */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs">Fetching movies from TMDB API...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-base text-muted-foreground">
            No movies found matching your filters.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid Mode */
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((movie) => (
            <Link
              key={movie.id}
              href={`/movies/${movie.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute top-2.5 right-2.5 rounded-full bg-background/80 backdrop-blur px-2 py-0.5 text-xs font-semibold text-amber-400">
                  ⭐ {movie.rating}
                </div>
                <div className="absolute top-2.5 left-2.5 rounded-full bg-primary/90 backdrop-blur px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                  {movie.ageRating || "12+"}
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <h3 className="font-semibold text-white group-hover:text-primary transition line-clamp-1">
                    {movie.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {movie.genres?.join(" · ")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {movie.duration} · {movie.language}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                  <span className="text-xs font-semibold text-primary">
                    From {formatPrice(movie.fromPrice)}
                  </span>
                  <span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white group-hover:bg-primary/90 transition">
                    Book
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* List Mode */
        <div className="mt-8 space-y-3">
          {filtered.map((movie) => (
            <Link
              key={movie.id}
              href={`/movies/${movie.slug}`}
              className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/50 hover:bg-card/80"
            >
              <div className="flex items-center gap-4">
                <div className="h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-primary transition">
                    {movie.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span className="text-amber-400 font-semibold">
                      ⭐ {movie.rating}
                    </span>
                    <span>·</span>
                    <span>{movie.genres?.join(", ")}</span>
                    <span>·</span>
                    <span>{movie.duration}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-primary hidden sm:inline">
                  From {formatPrice(movie.fromPrice)}
                </span>
                <span className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-white group-hover:bg-primary/90 transition">
                  Showtimes
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
