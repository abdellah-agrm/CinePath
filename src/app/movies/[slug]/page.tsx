"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  Heart,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Star,
  Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

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

export default function MovieDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedCinema, setSelectedCinema] = useState("cinepath-casablanca");
  const [selectedFormat, setSelectedFormat] = useState("ALL");
  const [isLiked, setIsLiked] = useState(false);

  // Generate the next 5 days
  const days = [
    { label: "Today", date: "10 Nov" },
    { label: "Tomorrow", date: "11 Nov" },
    { label: "Wed", date: "12 Nov" },
    { label: "Thu", date: "13 Nov" },
    { label: "Fri", date: "14 Nov" },
  ];

  useEffect(() => {
    async function fetchMovieDetails() {
      try {
        setLoading(true);
        const res = await fetch(`/api/movies/${slug}`);
        const json = await res.json();
        if (json.success && json.data) {
          setMovie(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch movie details:", err);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchMovieDetails();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs">Loading movie from TMDB...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-white">Movie not found</h2>
        <Link href="/movies" className="mt-4 inline-block text-xs text-primary underline">
          Back to movie list
        </Link>
      </div>
    );
  }

  const filteredShowtimes = movie.showtimes.filter((s) => {
    if (selectedFormat !== "ALL" && !s.format.includes(selectedFormat)) return false;
    return true;
  });

  return (
    <div className="pb-24">
      {/* Hero Backdrop & Quick Actions */}
      <div className="relative aspect-[16/9] max-h-[460px] w-full overflow-hidden bg-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={movie.backdrop}
          alt={movie.title}
          className="h-full w-full object-cover brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        {/* Floating Top Nav */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <Link
            href="/movies"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background/60 backdrop-blur text-white hover:bg-background/80 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex gap-2">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-background/60 backdrop-blur text-white hover:bg-background/80 transition"
            >
              <Heart
                className={`h-5 w-5 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`}
              />
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: movie.title, url: window.location.href });
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-background/60 backdrop-blur text-white hover:bg-background/80 transition"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Title Overlay in Hero */}
        <div className="absolute bottom-6 left-4 right-4 max-w-7xl mx-auto px-2">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="rounded bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">
              {movie.ageRating}
            </span>
            <span className="text-xs text-muted-foreground">{movie.duration}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{movie.genres?.join(", ")}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {movie.title}
          </h1>

          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-semibold text-amber-400">
              <Star className="h-3.5 w-3.5 fill-amber-400" />
              {movie.rating} / 10
            </span>
            <span>Release: {movie.releaseDate}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
        {/* Day Strip */}
        <div className="border-b border-border pb-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            {days.map((day, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDayIndex(idx)}
                className={`flex flex-col items-center justify-center rounded-2xl px-5 py-2.5 text-xs font-semibold transition shrink-0 ${
                  selectedDayIndex === idx
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : "border border-border bg-card/60 text-muted-foreground hover:text-white"
                }`}
              >
                <span>{day.label}</span>
                <span className="text-[10px] opacity-80">{day.date}</span>
              </button>
            ))}
          </div>

          {/* Filters Bar: Cinema & Format */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <select
                value={selectedCinema}
                onChange={(e) => setSelectedCinema(e.target.value)}
                className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="cinepath-casablanca">CinePath Anfa (Casablanca)</option>
                <option value="cinepath-rabat">CinePath Agdal (Rabat)</option>
                <option value="cinepath-marrakech">CinePath Guéliz (Marrakech)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Format:</span>
              <div className="flex gap-1">
                {["ALL", "IMAX", "2D"].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setSelectedFormat(fmt)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      selectedFormat === fmt
                        ? "bg-muted text-white border border-border"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Showtimes Grid */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-white mb-4">Select Showtime</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {filteredShowtimes.map((session) => (
              <Link
                key={session.id}
                href={`/booking/${session.id}/seats`}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-4 transition hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-white group-hover:text-primary transition">
                      {session.time}
                    </span>
                    <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground uppercase tracking-wide">
                      {session.format}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{session.language}</span>
                    <span>{session.hall}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                  <span className="text-xs font-semibold text-primary">
                    from {formatPrice(session.fromPrice)}
                  </span>
                  {session.badge ? (
                    <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-400 border border-rose-500/20">
                      {session.badge}
                    </span>
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Synopsis, Cast & Details */}
        <section className="mt-12 rounded-3xl border border-border bg-card/60 p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white mb-2">Synopsis</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {movie.synopsis}
            </p>
          </div>

          <div className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground font-medium">Director</span>
              <p className="text-white font-semibold mt-0.5">{movie.director}</p>
            </div>
            <div>
              <span className="text-muted-foreground font-medium">Starring</span>
              <p className="text-white font-semibold mt-0.5">{movie.cast?.join(", ")}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
