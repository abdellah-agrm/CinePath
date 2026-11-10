import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNowPlayingMovies } from "@/lib/tmdb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase();
    const genre = searchParams.get("genre");

    let movies: any[] = [];

    // 1. Try querying local PostgreSQL database first
    try {
      const dbMovies = await prisma.movie.findMany({
        where: {
          status: "NOW_SHOWING",
          ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
        },
        include: {
          genres: {
            include: {
              genre: true,
            },
          },
        },
        orderBy: {
          releaseDate: "desc",
        },
      });

      if (dbMovies.length > 0) {
        movies = dbMovies.map((m) => ({
          id: m.id,
          title: m.title,
          slug: m.slug,
          synopsis: m.synopsis,
          duration: `${Math.floor(m.durationMin / 60)}h ${m.durationMin % 60}m`,
          durationMin: m.durationMin,
          rating: "8.2",
          ageRating: m.ageRating,
          genres: m.genres.map((g) => g.genre.name),
          formats: ["IMAX", "2D"],
          language: "VOSTFR",
          fromPrice: 90,
          poster: m.posterUrl,
          backdrop: m.posterUrl,
        }));
      }
    } catch {
      // Database not yet migrated, fall back to TMDB
    }

    // 2. If database has no movies yet, fetch directly from TMDB
    if (movies.length === 0) {
      const tmdbMovies = await getNowPlayingMovies();
      movies = tmdbMovies.map((m) => ({
        id: m.slug,
        title: m.title,
        slug: m.slug,
        synopsis: m.synopsis,
        duration: `${Math.floor(m.durationMin / 60)}h ${m.durationMin % 60}m`,
        durationMin: m.durationMin,
        rating: m.rating.toFixed(1),
        ageRating: m.ageRating,
        genres: m.genres,
        formats: ["IMAX", "2D"],
        language: "VOSTFR",
        fromPrice: 90,
        poster: m.posterUrl,
        backdrop: m.backdropUrl,
      }));
    }

    // Apply in-memory filters
    if (search) {
      movies = movies.filter((m) => m.title.toLowerCase().includes(search));
    }
    if (genre && genre !== "ALL") {
      movies = movies.filter((m) =>
        m.genres.some((g: string) => g.toLowerCase() === genre.toLowerCase())
      );
    }

    return NextResponse.json({ success: true, count: movies.length, data: movies });
  } catch (error) {
    console.error("Failed to fetch movies from API/TMDB:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
