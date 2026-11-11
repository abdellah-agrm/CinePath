import { prisma } from "@/lib/prisma";
import { getMovieBySlug } from "@/lib/tmdb";
import { redis } from "@/lib/redis";

// UUID v4 regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Ensures that a showtime exists in the PostgreSQL database,
 * whether accessed via direct UUID or dynamic slug (e.g. "showtime-gladiator-ii-2").
 * If PostgreSQL is down, this will throw an error to prevent silent offline failure.
 */
export async function ensureShowtimeInDb(showtimeIdOrSlug: string) {
  // 1. Direct UUID lookup
  if (UUID_REGEX.test(showtimeIdOrSlug)) {
    const existing = await prisma.showtime.findUnique({
      where: { id: showtimeIdOrSlug },
      include: {
        movie: true,
        hall: {
          include: {
            cinema: true,
            seats: { orderBy: [{ gridRow: "asc" }, { gridCol: "asc" }] },
          },
        },
        tickets: {
          where: { status: { in: ["ACTIVE", "USED"] } },
          select: { seatId: true },
        },
      },
    });

    if (existing) {
      return existing;
    }
  }

  // 2. Parse dynamic slug e.g. "showtime-gladiator-ii-2" or "dune-part-two"
  let slug = showtimeIdOrSlug.replace(/^showtime-/, "");
  let slot = "2"; // default slot 17:30

  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  if (["1", "2", "3"].includes(lastPart)) {
    slot = parts.pop()!;
    slug = parts.join("-");
  }

  // 3. Find or sync movie from TMDB into PostgreSQL
  let movie = await prisma.movie.findUnique({
    where: { slug },
  });

  if (!movie) {
    const tmdbMovie = await getMovieBySlug(slug);
    if (tmdbMovie) {
      movie = await prisma.movie.create({
        data: {
          title: tmdbMovie.title,
          slug: tmdbMovie.slug,
          synopsis: tmdbMovie.synopsis || "Now showing in CinePath Multiplex theatres.",
          durationMin: tmdbMovie.durationMin || 120,
          originalLanguage: tmdbMovie.originalLanguage || "en",
          ageRating: tmdbMovie.ageRating || "12+",
          releaseDate: tmdbMovie.releaseDate || new Date(),
          posterUrl: tmdbMovie.posterUrl || "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
          status: "NOW_SHOWING",
        },
      });
    } else {
      // Fallback movie record with title casing
      const formattedTitle = slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      movie = await prisma.movie.create({
        data: {
          title: formattedTitle,
          slug,
          synopsis: `Experience ${formattedTitle} in high-definition projection and immersive sound at CinePath.`,
          durationMin: 120,
          originalLanguage: "en",
          ageRating: "12+",
          releaseDate: new Date(),
          posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
          status: "NOW_SHOWING",
        },
      });
    }
  }

  // 4. Ensure Cinema and Hall exist
  let cinema = await prisma.cinema.findFirst({
    where: { slug: "cinepath-casablanca" },
  });

  if (!cinema) {
    cinema = await prisma.cinema.create({
      data: {
        name: "CinePath Anfa",
        slug: "cinepath-casablanca",
        city: "Casablanca",
        address: "Boulevard d'Anfa, Casablanca",
        phone: "+212 522 00 11 22",
      },
    });
  }

  let hall = await prisma.hall.findFirst({
    where: { cinemaId: cinema.id, name: slot === "1" ? "Hall 2 (Standard)" : "Hall 1 (IMAX)" },
    include: {
      seats: { orderBy: [{ gridRow: "asc" }, { gridCol: "asc" }] },
    },
  });

  if (!hall) {
    hall = await prisma.hall.create({
      data: {
        cinemaId: cinema.id,
        name: slot === "1" ? "Hall 2 (Standard)" : "Hall 1 (IMAX)",
        totalRows: 6,
        totalCols: 10,
        capacity: 60,
        type: slot === "1" ? "STANDARD" : "IMAX",
      },
      include: {
        seats: true,
      },
    });

    // Populate seats for the hall (Rows A through F, 10 cols)
    const rows = ["A", "B", "C", "D", "E", "F"];
    const seatsData = [];
    for (let r = 0; r < rows.length; r++) {
      const rowLabel = rows[r];
      const isVipRow = r >= 4;
      for (let c = 1; c <= 10; c++) {
        const isAisle = c === 5;
        seatsData.push({
          hallId: hall.id,
          rowLabel,
          seatNumber: c,
          gridRow: r + 1,
          gridCol: c,
          type: isVipRow ? ("VIP" as const) : ("STANDARD" as const),
          status: isAisle ? ("AISLE" as const) : ("ACTIVE" as const),
          priceModifier: isVipRow ? 30.0 : 0.0,
        });
      }
    }

    await prisma.seat.createMany({ data: seatsData });
    hall = await prisma.hall.findUniqueOrThrow({
      where: { id: hall.id },
      include: {
        seats: { orderBy: [{ gridRow: "asc" }, { gridCol: "asc" }] },
      },
    });
  }

  // 5. Calculate slot start time & pricing
  const startTime = new Date();
  if (slot === "1") {
    startTime.setHours(14, 30, 0, 0);
  } else if (slot === "2") {
    startTime.setHours(17, 30, 0, 0);
  } else {
    startTime.setHours(20, 0, 0, 0);
  }

  const durationMin = movie.durationMin || 120;
  const endTime = new Date(startTime.getTime() + durationMin * 60 * 1000);
  const basePrice = slot === "1" ? 80.0 : slot === "2" ? 110.0 : 120.0;
  const format = slot === "1" ? "TWO_D" : "IMAX";

  // Check if showtime already exists for this movie, hall, and time
  let showtime = await prisma.showtime.findFirst({
    where: {
      movieId: movie.id,
      hallId: hall.id,
      startTime: {
        gte: new Date(new Date(startTime).setHours(0, 0, 0, 0)),
        lte: new Date(new Date(startTime).setHours(23, 59, 59, 999)),
      },
    },
    include: {
      movie: true,
      hall: {
        include: {
          cinema: true,
          seats: { orderBy: [{ gridRow: "asc" }, { gridCol: "asc" }] },
        },
      },
      tickets: {
        where: { status: { in: ["ACTIVE", "USED"] } },
        select: { seatId: true },
      },
    },
  });

  if (!showtime) {
    showtime = await prisma.showtime.create({
      data: {
        movieId: movie.id,
        hallId: hall.id,
        startTime,
        endTime,
        basePrice,
        audioLanguage: "VOSTFR",
        subtitleLanguage: "FR",
        format,
        status: "SCHEDULED",
      },
      include: {
        movie: true,
        hall: {
          include: {
            cinema: true,
            seats: { orderBy: [{ gridRow: "asc" }, { gridCol: "asc" }] },
          },
        },
        tickets: {
          where: { status: { in: ["ACTIVE", "USED"] } },
          select: { seatId: true },
        },
      },
    });
  }

  return showtime;
}
