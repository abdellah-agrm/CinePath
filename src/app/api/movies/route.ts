import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNowPlayingMovies, FormattedMovie } from "@/lib/tmdb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim();
    const genre = searchParams.get("genre");

    // 1. Fetch live now playing movies from TMDB (up to 20 movies)
    let moviesList = await getNowPlayingMovies();

    // 2. Also check if local database has any custom seeded movies to merge
    try {
      const dbMovies = await Promise.race([
        prisma.movie.findMany({
          where: {
            status: "NOW_SHOWING",
          },
          include: {
            genres: {
              include: {
                genre: true,
              },
            },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("DB Timeout")), 1200)
        ),
      ]);

      if (dbMovies && dbMovies.length > 0) {
        const dbSlugs = new Set(moviesList.map((m) => m.slug));
        for (const dbm of dbMovies) {
          if (!dbSlugs.has(dbm.slug)) {
            moviesList.push({
              tmdbId: 999000,
              title: dbm.title,
              slug: dbm.slug,
              synopsis: dbm.synopsis,
              durationMin: dbm.durationMin,
              originalLanguage: dbm.originalLanguage,
              ageRating: dbm.ageRating,
              releaseDate: dbm.releaseDate,
              posterUrl: dbm.posterUrl,
              backdropUrl: dbm.posterUrl,
              rating: 8.4,
              genres: dbm.genres.map((g) => g.genre.name),
            });
          }
        }
      }
    } catch {
      // DB offline, continue with live TMDB movies
    }

    // 3. Format movies for front-end consumption
    let formatted = moviesList.map((m) => ({
      id: m.slug,
      title: m.title,
      slug: m.slug,
      synopsis: m.synopsis,
      duration: `${Math.floor(m.durationMin / 60)}h ${m.durationMin % 60}m`,
      durationMin: m.durationMin,
      rating: m.rating.toFixed(1),
      ageRating: m.ageRating,
      genres: m.genres,
      formats: m.rating >= 7.5 ? ["IMAX", "2D"] : ["2D", "3D"],
      language: "VOSTFR",
      fromPrice: 85,
      poster: m.posterUrl,
      backdrop: m.backdropUrl,
    }));

    // 4. Apply search & genre filters
    if (search) {
      formatted = formatted.filter(
        (m) =>
          m.title.toLowerCase().includes(search) ||
          m.genres.some((g) => g.toLowerCase().includes(search))
      );
    }

    if (genre && genre !== "ALL") {
      formatted = formatted.filter((m) =>
        m.genres.some((g) => g.toLowerCase() === genre.toLowerCase())
      );
    }

    return NextResponse.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error: any) {
    console.error("[Movies API] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch movies" },
      { status: 500 }
    );
  }
}
