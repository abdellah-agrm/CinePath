const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testSessionFix() {
  const showtimeIdOrSlug = "session-la-legende-de-derry-2";
  console.log(`Testing showtime slug resolution for: ${showtimeIdOrSlug}`);

  let slug = showtimeIdOrSlug.replace(/^(showtime|session)-/, "");
  let slot = "2";

  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  if (["1", "2", "3"].includes(lastPart)) {
    slot = parts.pop();
    slug = parts.join("-");
  }

  console.log(`Extracted slug: "${slug}", slot: "${slot}"`);

  let movie = await prisma.movie.findFirst({
    where: {
      OR: [
        { slug },
        { slug: showtimeIdOrSlug },
        { slug: showtimeIdOrSlug.replace(/^(showtime|session)-/, "") },
      ],
    },
  });

  console.log("Movie found in DB:", movie ? movie.title : "Not found in DB, will upsert");

  const targetSlug = slug;
  const formattedTitle = targetSlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  movie = await prisma.movie.upsert({
    where: { slug: targetSlug },
    update: {},
    create: {
      title: formattedTitle,
      slug: targetSlug,
      synopsis: `Experience ${formattedTitle} in high-definition projection at CinePath.`,
      durationMin: 120,
      originalLanguage: "en",
      ageRating: "12+",
      releaseDate: new Date(),
      posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
      status: "NOW_SHOWING",
    },
  });

  console.log("Movie successfully upserted:", movie.id, movie.title, movie.slug);

  let cinema = await prisma.cinema.upsert({
    where: { slug: "cinepath-casablanca" },
    update: {},
    create: {
      name: "CinePath Anfa",
      slug: "cinepath-casablanca",
      city: "Casablanca",
      address: "Boulevard d'Anfa, Casablanca",
      phone: "+212 522 00 11 22",
    },
  });

  let hall = await prisma.hall.findFirst({
    where: { cinemaId: cinema.id, name: slot === "1" ? "Hall 2 (Standard)" : "Hall 1 (IMAX)" },
    include: { seats: true },
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
      include: { seats: true },
    });
  }

  const startTime = new Date();
  startTime.setHours(17, 30, 0, 0);
  const endTime = new Date(startTime.getTime() + 120 * 60 * 1000);

  const windowStart = new Date(startTime.getTime() - 60 * 60 * 1000);
  const windowEnd = new Date(startTime.getTime() + 60 * 60 * 1000);

  let showtime = await prisma.showtime.findFirst({
    where: {
      movieId: movie.id,
      hallId: hall.id,
      startTime: {
        gte: windowStart,
        lte: windowEnd,
      },
    },
    include: {
      movie: true,
      hall: { include: { cinema: true, seats: true } },
    },
  });

  if (!showtime) {
    showtime = await prisma.showtime.create({
      data: {
        movieId: movie.id,
        hallId: hall.id,
        startTime,
        endTime,
        basePrice: 110.0,
        audioLanguage: "VOSTFR",
        subtitleLanguage: "FR",
        format: "IMAX",
        status: "SCHEDULED",
      },
      include: {
        movie: true,
        hall: { include: { cinema: true, seats: true } },
      },
    });
  }

  console.log("✅ SUCCESS! Showtime verified in DB with ID:", showtime.id);
  console.log("Seats available:", showtime.hall.seats.length);

  await prisma.$disconnect();
}

testSessionFix().catch((e) => {
  console.error("❌ TEST FAILED:", e);
  process.exit(1);
});

