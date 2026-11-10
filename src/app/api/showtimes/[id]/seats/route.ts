import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: showtimeId } = await params;

    const showtime = await prisma.showtime.findUnique({
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

    if (!showtime) {
      return NextResponse.json(
        { success: false, message: "Showtime not found" },
        { status: 404 }
      );
    }

    const bookedSeatIds = new Set(showtime.tickets.map((t) => t.seatId));

    // Check Redis active seat locks
    const seatKeys = showtime.hall.seats.map(
      (s) => `lock:${showtimeId}:${s.id}`
    );
    const lockedValues = seatKeys.length > 0 ? await redis.mget(seatKeys) : [];
    const lockedSeatIds = new Set<string>();

    showtime.hall.seats.forEach((seat, idx) => {
      if (lockedValues[idx] !== null) {
        lockedSeatIds.add(seat.id);
      }
    });

    const seatsWithStatus = showtime.hall.seats.map((seat) => ({
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
    console.error("Failed to fetch showtime seats:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

