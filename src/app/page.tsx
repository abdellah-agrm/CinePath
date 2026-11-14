import { prisma } from "@/lib/prisma";
import { getNowPlayingMovies, FormattedMovie } from "@/lib/tmdb";
import { HomeCinemaView } from "@/components/cinema/home-cinema-view";
import { CinemaFAQ } from "@/components/cinema-faq";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // 1. Fetch live movies from PostgreSQL database
  let dbMovies: FormattedMovie[] = [];
  try {
    const rawDbMovies = await prisma.movie.findMany({
      where: { status: { in: ["NOW_SHOWING", "COMING_SOON"] } },
      orderBy: { createdAt: "desc" },
      include: { genres: { include: { genre: true } } },
    });

    dbMovies = rawDbMovies.map((m) => ({
      tmdbId: 0,
      title: m.title,
      slug: m.slug,
      synopsis: m.synopsis,
      durationMin: m.durationMin,
      originalLanguage: m.originalLanguage,
      ageRating: m.ageRating,
      releaseDate: m.releaseDate,
      posterUrl: m.posterUrl,
      backdropUrl: (m as any).backdropUrl || m.posterUrl,
      rating: 8.4,
      genres: m.genres.map((g) => g.genre.name),
    }));
  } catch (err) {
    console.warn("[HomePage] DB fetch fallback:", err);
  }

  // 2. Fetch live TMDB movies
  const tmdbMovies = await getNowPlayingMovies();

  // 3. Merge: Database movies come first so the latest movie is always in the main hero billboard
  const existingSlugs = new Set(dbMovies.map((m) => m.slug));
  const filteredTmdb = tmdbMovies.filter((m) => !existingSlugs.has(m.slug));
  const allMovies = [...dbMovies, ...filteredTmdb];

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen">
      {/* Dynamic Cinema View with Hero & Carousels matching pathe_home.png */}
      <HomeCinemaView movies={allMovies} />

      {/* Interactive FAQ Accordion matching pathe_home.png */}
      <CinemaFAQ />
    </div>
  );
}
