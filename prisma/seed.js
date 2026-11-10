const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding CinePath database...");

  // 1. Genres
  const action = await prisma.genre.upsert({
    where: { name: "Action" },
    update: {},
    create: { name: "Action" },
  });
  const scifi = await prisma.genre.upsert({
    where: { name: "Sci-Fi" },
    update: {},
    create: { name: "Sci-Fi" },
  });
  const drama = await prisma.genre.upsert({
    where: { name: "Drama" },
    update: {},
    create: { name: "Drama" },
  });

  // 2. Cinema
  const cinema = await prisma.cinema.upsert({
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

  // 3. Hall with 6 rows x 10 cols grid (60 seats)
  let hall = await prisma.hall.findFirst({
    where: { cinemaId: cinema.id, name: "Hall 1 (IMAX)" },
  });

  if (!hall) {
    hall = await prisma.hall.create({
      data: {
        cinemaId: cinema.id,
        name: "Hall 1 (IMAX)",
        totalRows: 6,
        totalCols: 10,
        capacity: 60,
        type: "IMAX",
      },
    });

    const rows = ["A", "B", "C", "D", "E", "F"];
    const seatsData = [];

    for (let r = 0; r < rows.length; r++) {
      const rowLabel = rows[r];
      const isVipRow = r >= 4; // Rows E and F are VIP

      for (let c = 1; c <= 10; c++) {
        // Leave column 5 as aisle space
        const isAisle = c === 5;

        seatsData.push({
          hallId: hall.id,
          rowLabel: rowLabel,
          seatNumber: c,
          gridRow: r + 1,
          gridCol: c,
          type: isVipRow ? "VIP" : "STANDARD",
          status: isAisle ? "AISLE" : "ACTIVE",
          priceModifier: isVipRow ? 30.0 : 0.0,
        });
      }
    }

    await prisma.seat.createMany({
      data: seatsData,
    });
    console.log("Created 60 hall seats with VIP rows and aisle.");
  }

  // 4. Movie: Dune Part Two
  const movie = await prisma.movie.upsert({
    where: { slug: "dune-part-two" },
    update: {},
    create: {
      title: "Dune: Part Two",
      slug: "dune-part-two",
      synopsis:
        "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
      durationMin: 166,
      originalLanguage: "en",
      ageRating: "12+",
      releaseDate: new Date("2026-03-01"),
      posterUrl:
        "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
      status: "NOW_SHOWING",
      genres: {
        create: [
          { genre: { connect: { id: action.id } } },
          { genre: { connect: { id: scifi.id } } },
        ],
      },
    },
  });

  // 5. Showtime
  const todayAtEvening = new Date();
  todayAtEvening.setHours(20, 0, 0, 0);

  const endTime = new Date(todayAtEvening.getTime() + 166 * 60 * 1000);

  await prisma.showtime.create({
    data: {
      movieId: movie.id,
      hallId: hall.id,
      startTime: todayAtEvening,
      endTime: endTime,
      basePrice: 90.0,
      audioLanguage: "VOSTFR",
      subtitleLanguage: "FR",
      format: "IMAX",
      status: "SCHEDULED",
    },
  });

  // 6. Users (RBAC: Admin, Staff, Customer)
  const bcrypt = require("bcryptjs");
  const adminHash = await bcrypt.hash("Admin123!", 12);
  const staffHash = await bcrypt.hash("Staff123!", 12);
  const customerHash = await bcrypt.hash("Customer123!", 12);

  await prisma.user.upsert({
    where: { email: "admin@cinepath.com" },
    update: { role: "ADMIN", passwordHash: adminHash },
    create: {
      email: "admin@cinepath.com",
      fullName: "Abdellah Agourram (Admin)",
      passwordHash: adminHash,
      role: "ADMIN",
      isVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "staff@cinepath.com" },
    update: { role: "STAFF", passwordHash: staffHash },
    create: {
      email: "staff@cinepath.com",
      fullName: "Cinema Gate Staff",
      passwordHash: staffHash,
      role: "STAFF",
      isVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "customer@cinepath.com" },
    update: { role: "CUSTOMER", passwordHash: customerHash },
    create: {
      email: "customer@cinepath.com",
      fullName: "Sara Mansouri",
      passwordHash: customerHash,
      role: "CUSTOMER",
      isVerified: true,
    },
  });

  console.log("✅ Seed completed successfully! Admin, Staff, and Customer users created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

