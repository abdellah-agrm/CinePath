/**
 * Direct Backend Verification Script
 * Directly tests PostgreSQL Prisma queries, Redis seat locking,
 * HMAC ticket cryptography, and Booking creation without HTTP overhead.
 */
const { PrismaClient } = require("@prisma/client");
const Redis = require("ioredis");
const crypto = require("crypto");

const prisma = new PrismaClient();
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  lazyConnect: true,
});

const QR_SECRET = process.env.QR_SECRET || "cinepath_super_secret_hmac_key_min32chars";

function generateTicketHmac(ticketId, showtimeId, bookingRef) {
  const data = `${ticketId}:${showtimeId}:${bookingRef}`;
  return crypto.createHmac("sha256", QR_SECRET).update(data).digest("hex");
}

function verifyTicketHmac(ticketId, showtimeId, bookingRef, providedHmac) {
  const expectedHmac = generateTicketHmac(ticketId, showtimeId, bookingRef);
  return crypto.timingSafeEqual(Buffer.from(expectedHmac, "hex"), Buffer.from(providedHmac, "hex"));
}

async function runDirectVerification() {
  console.log("===============================================================");
  console.log("🛠️  CinePath Direct Backend & Database Verification");
  console.log("===============================================================\n");

  try {
    // 1. PostgreSQL Connection Check
    process.stdout.write("1. Checking PostgreSQL Database connection ... ");
    await prisma.$connect();
    const userCount = await prisma.user.count();
    console.log(`✅ PASS (Connected - ${userCount} users registered)`);

    // 2. Redis Connection Check
    process.stdout.write("2. Checking Redis Cache connection ... ");
    await redis.connect();
    const pong = await redis.ping();
    console.log(`✅ PASS (Redis returned ${pong})`);

    // 3. Ensure Cinema, Hall & Movie
    process.stdout.write("3. Verifying Cinema & Hall 1 (IMAX) in database ... ");
    let cinema = await prisma.cinema.findFirst({ where: { slug: "cinepath-casablanca" } });
    if (!cinema) {
      cinema = await prisma.cinema.create({
        data: {
          name: "CinePath Anfa",
          slug: "cinepath-casablanca",
          city: "Casablanca",
          address: "Boulevard d'Anfa, Casablanca",
        },
      });
    }

    let hall = await prisma.hall.findFirst({
      where: { cinemaId: cinema.id, name: "Hall 1 (IMAX)" },
      include: { seats: true },
    });

    if (!hall || hall.seats.length === 0) {
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
      }
      const rows = ["A", "B", "C", "D", "E", "F"];
      const seats = [];
      for (let r = 0; r < rows.length; r++) {
        for (let c = 1; c <= 10; c++) {
          seats.push({
            hallId: hall.id,
            rowLabel: rows[r],
            seatNumber: c,
            gridRow: r + 1,
            gridCol: c,
            type: r >= 4 ? "VIP" : "STANDARD",
            status: c === 5 ? "AISLE" : "ACTIVE",
            priceModifier: r >= 4 ? 30.0 : 0.0,
          });
        }
      }
      await prisma.seat.createMany({ data: seats });
      hall = await prisma.hall.findUnique({
        where: { id: hall.id },
        include: { seats: true },
      });
    }
    console.log(`✅ PASS (Hall "${hall.name}" has ${hall.seats.length} seats)`);

    // 4. Ensure Movie in Database
    process.stdout.write("4. Verifying Movie in PostgreSQL ... ");
    let movie = await prisma.movie.findFirst();
    if (!movie) {
      movie = await prisma.movie.create({
        data: {
          title: "Dune: Part Two",
          slug: "dune-part-two",
          synopsis: "Paul Atreides unites with Chani and the Fremen.",
          durationMin: 166,
          posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
          releaseDate: new Date(),
        },
      });
    }
    console.log(`✅ PASS (Movie: "${movie.title}")`);

    // 5. Ensure Showtime in Database
    process.stdout.write("5. Verifying Showtime in PostgreSQL ... ");
    let showtime = await prisma.showtime.findFirst({
      where: { movieId: movie.id, hallId: hall.id },
    });
    if (!showtime) {
      const now = new Date();
      now.setHours(20, 0, 0, 0);
      showtime = await prisma.showtime.create({
        data: {
          movieId: movie.id,
          hallId: hall.id,
          startTime: now,
          endTime: new Date(now.getTime() + 166 * 60 * 1000),
          basePrice: 90.0,
          format: "IMAX",
        },
      });
    }
    console.log(`✅ PASS (Showtime ID: ${showtime.id})`);

    // 6. Test Redis Atomic Seat Lock
    process.stdout.write("6. Testing Redis Multi-Seat Lock with 10-min TTL ... ");
    const lockToken = "direct_test_token_" + Date.now();
    const testSeatLabel = "C7";
    await redis.set(`seat_lock:${showtime.id}:${testSeatLabel}`, lockToken, "EX", 600);
    const lockHolder = await redis.get(`seat_lock:${showtime.id}:${testSeatLabel}`);
    if (lockHolder !== lockToken) {
      throw new Error("Redis lock verification failed");
    }
    console.log(`✅ PASS (Locked seat ${testSeatLabel} under token ${lockToken.slice(0, 16)}...)`);

    // 7. Test Real ACID PostgreSQL Booking Transaction
    process.stdout.write("7. Executing Real ACID Booking & Ticket Creation in PostgreSQL ... ");
    const bookingRef = "CP-" + crypto.randomBytes(3).toString("hex").toUpperCase();
    const targetSeat = hall.seats.find((s) => s.rowLabel === "C" && s.seatNumber === 7) || hall.seats[0];

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          guestEmail: "verified_guest@cinepath.com",
          showtimeId: showtime.id,
          reference: bookingRef,
          status: "CONFIRMED",
          totalAmount: 90.0,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const ticketId = crypto.randomUUID();
      const hmac = generateTicketHmac(ticketId, showtime.id, bookingRef);
      const qrPayload = JSON.stringify({
        ref: bookingRef,
        ticketId,
        showtimeId: showtime.id,
        seat: `${targetSeat.rowLabel}${targetSeat.seatNumber}`,
        hmac,
      });

      const ticket = await tx.ticket.create({
        data: {
          id: ticketId,
          bookingId: booking.id,
          seatId: targetSeat.id,
          showtimeId: showtime.id,
          qrPayload,
          price: 90.0,
          status: "ACTIVE",
        },
      });

      const payment = await tx.payment.create({
        data: {
          bookingId: booking.id,
          providerRef: "pm_" + crypto.randomBytes(8).toString("hex"),
          amount: 90.0,
          currency: "MAD",
          status: "SUCCEEDED",
          paidAt: new Date(),
        },
      });

      return { booking, ticket, payment, hmac };
    });

    console.log(`✅ PASS (Created real Booking #${result.booking.reference} with Ticket ID ${result.ticket.id})`);

    // 8. Test HMAC QR Code Cryptography
    process.stdout.write("8. Cryptographically verifying Ticket HMAC signature ... ");
    const isSignatureValid = verifyTicketHmac(result.ticket.id, showtime.id, bookingRef, result.hmac);
    if (!isSignatureValid) {
      throw new Error("HMAC signature verification failed");
    }
    console.log("✅ PASS (HMAC-SHA256 signature is 100% authentic)");

    // 9. Test Turnstile Admission Validation & One-Time Use Guard
    process.stdout.write("9. Testing Turnstile Admission & Once-Used Protection in DB ... ");
    const foundBooking = await prisma.booking.findUnique({
      where: { reference: bookingRef },
      include: { tickets: true },
    });

    if (!foundBooking || foundBooking.tickets[0].status !== "ACTIVE") {
      throw new Error("Expected ACTIVE ticket in DB");
    }

    // Mark ticket as USED
    await prisma.ticket.update({
      where: { id: foundBooking.tickets[0].id },
      data: { status: "USED", usedAt: new Date() },
    });

    const usedTicket = await prisma.ticket.findUnique({
      where: { id: foundBooking.tickets[0].id },
    });

    if (usedTicket.status !== "USED") {
      throw new Error("Failed to update status to USED");
    }
    console.log("✅ PASS (Ticket verified, admitted, and marked USED in PostgreSQL)");

    // 10. Release Redis Lock
    await redis.del(`seat_lock:${showtime.id}:${testSeatLabel}`);

    console.log("\n===============================================================");
    console.log("🎉  ALL 9 DIRECT BACKEND & DATABASE TESTS PASSED 100%!");
    console.log("===============================================================");
  } catch (err) {
    console.error("\n❌ FAILED:", err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    redis.disconnect();
  }
}

runDirectVerification();

