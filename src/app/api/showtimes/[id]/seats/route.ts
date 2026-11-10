import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: showtimeId } = await params;

    let showtime: any = null;

    try {
      showtime = await prisma.showtime.findUnique({
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
      });
    } catch (dbError) {
      console.warn("[Seats API] Database offline, using fallback hall grid:", dbError);
    }

    if (!showtime) {
      // Fallback demo hall grid if DB is not populated
      const demoSeats = [];
      const rows = ["A", "B", "C", "D", "E", "F"];
      for (let r = 0; r < rows.length; r++) {
        for (let c = 1; c <= 10; c++) {
          const isAisle = c === 5;
          const isVip = r >= 4;
          const isBooked = !isAisle && r === 2 && (c === 3 || c === 4);
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
            id: showtimeId || "demo-showtime",
            startTime: new Date().toISOString(),
            format: "IMAX 2D",
            audioLanguage: "VOSTFR",
            basePrice: 90,
            movieTitle: "Dune: Part Two",
            hallName: "Hall 1 (IMAX)",
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
    } catch (redisError) {
      console.warn("[Seats API] Redis lock check failed, proceeding without active locks:", redisError);
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
          startTime: showtime.startTime,
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
  } catch (error) {
    console.error("[Seats API] Unhandled exception:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load seat layout" },
      { status: 500 }
    );
  }
}
