import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMovieBySlug, FormattedMovie } from "@/lib/tmdb";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // 1. Check in database first
    try {
      const dbMovie = await Promise.race([
        prisma.movie.findUnique({
          where: { slug },
          include: {
            genres: { include: { genre: true } },
            showtimes: {
              include: { hall: true },
              orderBy: { startTime: "asc" },
            },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("DB Timeout")), 1200)
        ),
      ]);

      if (dbMovie) {
        return NextResponse.json({
          success: true,
          data: {
            title: dbMovie.title,
            slug: dbMovie.slug,
            rating: "8.4",
            ageRating: dbMovie.ageRating,
            duration: `${Math.floor(dbMovie.durationMin / 60)}h ${dbMovie.durationMin % 60}m`,
            genres: dbMovie.genres.map((g) => g.genre.name),
            releaseDate: dbMovie.releaseDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            synopsis: dbMovie.synopsis,
            director: "Director",
            cast: ["Lead Actor", "Supporting Cast"],
            backdrop: dbMovie.posterUrl,
            poster: dbMovie.posterUrl,
            showtimes: dbMovie.showtimes.map((s) => ({
              id: s.id,
              time: s.startTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              hall: s.hall.name,
              format: s.format,
              language: s.audioLanguage,
              fromPrice: Number(s.basePrice),
              badge: null,
            })),
          },
        });
      }
    } catch {
      // Continue to live TMDB lookup
    }

    // 2. Fetch from TMDB data
    const movie = await getMovieBySlug(slug);

    if (!movie) {
      return NextResponse.json(
        { success: false, message: "Movie not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        title: movie.title,
        slug: movie.slug,
        rating: movie.rating.toFixed(1),
        ageRating: movie.ageRating,
        duration: `${Math.floor(movie.durationMin / 60)}h ${movie.durationMin % 60}m`,
        genres: movie.genres,
        releaseDate: movie.releaseDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        synopsis: movie.synopsis,
        director: movie.director || "Official Studio Release",
        cast: movie.cast || ["Lead Actor", "Supporting Cast", "Featured Performer"],
        backdrop: movie.backdropUrl,
        poster: movie.posterUrl,
        showtimes: [
          {
            id: `showtime-${movie.slug}-1`,
            time: "14:30",
            hall: "Hall 2 (Standard)",
            format: "2D",
            language: "VF",
            fromPrice: 80,
            badge: null,
          },
          {
            id: `showtime-${movie.slug}-2`,
            time: "17:30",
            hall: "Hall 1 (IMAX)",
            format: "IMAX 2D",
            language: "VOSTFR",
            fromPrice: 110,
            badge: "Few seats left",
          },
          {
            id: `showtime-${movie.slug}-3`,
            time: "20:00",
            hall: "Hall 1 (IMAX)",
            format: "IMAX 2D",
            language: "VOSTFR",
            fromPrice: 120,
            badge: "Selling fast",
          },
        ],
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch movie details:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Movie not found" },
      { status: 404 }
    );
  }
}

