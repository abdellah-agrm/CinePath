import Link from "next/link";
import { Sparkles, Calendar, MapPin, ChevronRight } from "lucide-react";
import { getNowPlayingMovies } from "@/lib/tmdb";
import { formatPrice } from "@/lib/utils";

export default async function HomePage() {
  const movies = await getNowPlayingMovies();

  return (
    <div className="pb-24 md:pb-12">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-card via-background to-background py-16 md:py-24 border-b border-border/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(225,29,72,0.15),rgba(255,255,255,0))]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Next-Gen Cinema Booking</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white">
            Experience Cinema <br />
            <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
              Without the Queue
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground">
            Real-time interactive seat selection, instant digital tickets with secure QR codes,
            and fast guest checkout in under 90 seconds.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="#now-showing"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition"
            >
              Browse Movies
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/cinemas"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 backdrop-blur px-6 py-3 text-sm font-semibold text-foreground hover:bg-card transition"
            >
              <MapPin className="h-4 w-4 text-primary" />
              Find a Cinema
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Filter Bar */}
      <section className="sticky top-16 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto px-4 sm:px-6 lg:px-8 scrollbar-none">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0">
            Quick Filter:
          </span>
          <button className="rounded-full bg-primary text-white px-3.5 py-1 text-xs font-medium shrink-0">
            Today
          </button>
          <button className="rounded-full border border-border px-3.5 py-1 text-xs font-medium text-muted-foreground hover:text-white shrink-0">
            Tomorrow
          </button>
          <button className="rounded-full border border-border px-3.5 py-1 text-xs font-medium text-muted-foreground hover:text-white shrink-0">
            IMAX
          </button>
          <button className="rounded-full border border-border px-3.5 py-1 text-xs font-medium text-muted-foreground hover:text-white shrink-0">
            3D
          </button>
          <button className="rounded-full border border-border px-3.5 py-1 text-xs font-medium text-muted-foreground hover:text-white shrink-0">
            VOSTFR
          </button>
        </div>
      </section>

      {/* Now Showing Grid */}
      <section id="now-showing" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Now Showing in Theatres</h2>
            <p className="text-sm text-muted-foreground">Powered live by The Movie Database (TMDB)</p>
          </div>
          <Link href="/movies" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Live Movie Cards from TMDB */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {movies.map((movie) => (
            <Link
              key={movie.slug}
              href={`/movies/${movie.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute top-2.5 right-2.5 rounded-full bg-background/80 backdrop-blur px-2 py-0.5 text-xs font-semibold text-amber-400">
                  ⭐ {movie.rating}
                </div>
                <div className="absolute top-2.5 left-2.5 rounded-full bg-primary/90 backdrop-blur px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                  {movie.ageRating}
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <h3 className="font-semibold text-white group-hover:text-primary transition line-clamp-1">
                    {movie.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {movie.genres.join(" · ")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {Math.floor(movie.durationMin / 60)}h {movie.durationMin % 60}m
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                  <span className="text-xs font-semibold text-primary">From {formatPrice(90)}</span>
                  <span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white group-hover:bg-primary/90 transition">
                    Book
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
