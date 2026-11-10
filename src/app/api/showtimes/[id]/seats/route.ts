import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { getMovieBySlug } from "@/lib/tmdb";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: showtimeId } = await params;

    let showtime: any = null;

    // 1. Check if showtimeId exists in Prisma database
    try {
      showtime = await Promise.race([
        prisma.showtime.findUnique({
          where: { id: showtimeId },
          include: {
            movie: true,
            hall: {
              include: {
                seats: {
                  orderBy: [{ gridRow: "asc" }, { gridCol: "asc" }],
                },
              },
            },
            tickets: {
              where: {
                status: { in: ["ACTIVE", "USED"] },
              },
              select: { seatId: true },
            },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("DB Timeout")), 1200)
        ),
      ]);
    } catch {
      // Continue to dynamic TMDB showtime generator
    }

    // 2. If showtime is not in DB, dynamically generate from TMDB movie slug
    if (!showtime) {
      let movieTitle = "Cinema Feature";
      let timeStr = "20:00";
      let hallName = "Hall 1 (IMAX)";
      let formatStr = "IMAX 2D";
      let basePrice = 90;

      // Extract movie slug from showtimeId e.g. "showtime-gladiator-ii-2"
      if (showtimeId && showtimeId.startsWith("showtime-")) {
        const parts = showtimeId.replace("showtime-", "").split("-");
        const slot = parts.pop(); // last part is slot number (1, 2, or 3)
        const slug = parts.join("-");

        const movie = await getMovieBySlug(slug);
        if (movie) {
          movieTitle = movie.title;
        } else {
          movieTitle = slug
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
        }

        if (slot === "1") {
          timeStr = "14:30";
          hallName = "Hall 2 (Standard)";
          formatStr = "2D";
          basePrice = 80;
        } else if (slot === "2") {
          timeStr = "17:30";
          hallName = "Hall 1 (IMAX)";
          formatStr = "IMAX 2D";
          basePrice = 110;
        } else {
          timeStr = "20:00";
          hallName = "Hall 1 (IMAX)";
          formatStr = "IMAX 2D";
          basePrice = 120;
        }
      }

      // Generate 6 rows x 10 cols seat grid
      const demoSeats = [];
      const rows = ["A", "B", "C", "D", "E", "F"];
      for (let r = 0; r < rows.length; r++) {
        for (let c = 1; c <= 10; c++) {
          const isAisle = c === 5;
          const isVip = r >= 4;
          // Sample a few booked seats for realism
          const isBooked = !isAisle && (r === 2 && (c === 3 || c === 4)) || (r === 3 && c === 8);
          demoSeats.push({
            id: `seat-${rows[r]}-${c}`,
            rowLabel: rows[r],
            seatNumber: c,
            gridRow: r + 1,
            gridCol: c,
            type: isVip ? "VIP" : "STANDARD",
            status: isAisle ? "AISLE" : "ACTIVE",
            priceModifier: isVip ? 30 : 0,
            isBooked,
            isLocked: false,
          });
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          showtime: {
            id: showtimeId,
            startTime: `Today · ${timeStr}`,
            format: formatStr,
            audioLanguage: "VOSTFR",
            basePrice,
            movieTitle,
            hallName,
            totalRows: 6,
            totalCols: 10,
          },
          seats: demoSeats,
        },
      });
    }

    const bookedSeatIds = new Set(showtime.tickets.map((t: any) => t.seatId));

    // Check Redis active seat locks with safe try/catch
    const lockedSeatIds = new Set<string>();
    try {
      const seatKeys = showtime.hall.seats.map((s: any) => `lock:${showtimeId}:${s.id}`);
      const lockedValues = seatKeys.length > 0 ? await redis.mget(seatKeys) : [];
      showtime.hall.seats.forEach((seat: any, idx: number) => {
        if (lockedValues[idx] !== null && lockedValues[idx] !== undefined) {
          lockedSeatIds.add(seat.id);
        }
      });
    } catch {
      // Redis offline, proceed
    }

    const seatsWithStatus = showtime.hall.seats.map((seat: any) => ({
      id: seat.id,
      rowLabel: seat.rowLabel,
      seatNumber: seat.seatNumber,
      gridRow: seat.gridRow,
      gridCol: seat.gridCol,
      type: seat.type,
      status: seat.status,
      priceModifier: Number(seat.priceModifier),
      isBooked: bookedSeatIds.has(seat.id),
      isLocked: lockedSeatIds.has(seat.id),
    }));

    return NextResponse.json({
      success: true,
      data: {
        showtime: {
          id: showtime.id,
          startTime: typeof showtime.startTime === "string" ? showtime.startTime : new Date(showtime.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          format: showtime.format,
          audioLanguage: showtime.audioLanguage,
          basePrice: Number(showtime.basePrice),
          movieTitle: showtime.movie.title,
          hallName: showtime.hall.name,
          totalRows: showtime.hall.totalRows,
          totalCols: showtime.hall.totalCols,
        },
        seats: seatsWithStatus,
      },
    });
  } catch (error: any) {
    console.error("[Seats API] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load seat layout" },
      { status: 500 }
    );
  }
}
