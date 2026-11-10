import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNowPlayingMovies } from "@/lib/tmdb";

export async function POST() {
  try {
    const movies = await getNowPlayingMovies();
    const syncedMovies = [];

    // Ensure at least one cinema and hall exist for showtime scheduling
    let cinema = await prisma.cinema.findFirst({
      include: { halls: true },
    });

    if (!cinema) {
      cinema = await prisma.cinema.create({
        data: {
          name: "CinePath Anfa",
          slug: "cinepath-anfa",
          city: "Casablanca",
          address: "Boulevard d'Anfa, Casablanca",
          phone: "+212 522 00 11 22",
          halls: {
            create: [
              {
                name: "Hall 1 (IMAX)",
                totalRows: 6,
                totalCols: 10,
                capacity: 60,
                type: "IMAX",
              },
            ],
          },
        },
        include: { halls: true },
      });
    }

    const defaultHall = cinema.halls[0];

    for (const movieData of movies) {
      // 1. Upsert Genres
      const genreConnectList = [];
      for (const gName of movieData.genres) {
        const genre = await prisma.genre.upsert({
          where: { name: gName },
          update: {},
          create: { name: gName },
        });
        genreConnectList.push(genre.id);
      }

      // 2. Upsert Movie
      const movie = await prisma.movie.upsert({
        where: { slug: movieData.slug },
        update: {
          title: movieData.title,
          synopsis: movieData.synopsis,
          posterUrl: movieData.posterUrl,
          durationMin: movieData.durationMin,
          status: "NOW_SHOWING",
        },
        create: {
          title: movieData.title,
          slug: movieData.slug,
          synopsis: movieData.synopsis,
          durationMin: movieData.durationMin,
          originalLanguage: movieData.originalLanguage,
          ageRating: movieData.ageRating,
          releaseDate: movieData.releaseDate,
          posterUrl: movieData.posterUrl,
          status: "NOW_SHOWING",
        },
      });

      // Connect movie to genres
      for (const gId of genreConnectList) {
        await prisma.movieGenre.upsert({
          where: {
            movieId_genreId: {
              movieId: movie.id,
              genreId: gId,
            },
          },
          update: {},
          create: {
            movieId: movie.id,
            genreId: gId,
          },
        });
      }

      // 3. Ensure a Showtime exists for today
      if (defaultHall) {
        const existingShowtime = await prisma.showtime.findFirst({
          where: {
            movieId: movie.id,
            hallId: defaultHall.id,
          },
        });

        if (!existingShowtime) {
          const startTime = new Date();
          startTime.setHours(20, 0, 0, 0); // 8:00 PM today
          const endTime = new Date(
            startTime.getTime() + movieData.durationMin * 60 * 1000
          );

          await prisma.showtime.create({
            data: {
              movieId: movie.id,
              hallId: defaultHall.id,
              startTime,
              endTime,
              basePrice: 90.0,
              format: "IMAX",
              audioLanguage: "VOSTFR",
              subtitleLanguage: "FR",
              status: "SCHEDULED",
            },
          });
        }
      }

      syncedMovies.push({
        id: movie.id,
        title: movie.title,
        slug: movie.slug,
        posterUrl: movie.posterUrl,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedMovies.length} now-playing movies from TMDB`,
      count: syncedMovies.length,
      movies: syncedMovies,
    });
  } catch (error: any) {
    console.error("TMDB Sync Error:", error);
    return NextResponse.json(
      { success: false, message: "Sync failed", error: error.message },
      { status: 500 }
    );
  }
}

