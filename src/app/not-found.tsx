import Link from "next/link";
import { Film, Home, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-6 ring-8 ring-primary/5">
        <Film className="h-8 w-8" />
      </div>

      <span className="text-xs font-mono font-bold text-primary uppercase tracking-widest">
        404 — Screen Blank
      </span>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-2">
        Showtime Not Found
      </h1>

      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        The movie, screening, or ticket you were searching for does not exist or has
        finished playing.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary/90 transition"
        >
          <Home className="h-4 w-4" />
          Back to Movies
        </Link>
      </div>
    </div>
  );
}

