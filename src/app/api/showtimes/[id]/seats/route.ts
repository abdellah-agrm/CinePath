import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { ensureShowtimeInDb } from "@/lib/db-showtimes";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: showtimeId } = await params;
    const { searchParams } = new URL(request.url);
    const paramTime = searchParams.get("time");
    const paramHall = searchParams.get("hall");
    const paramFormat = searchParams.get("fmt");

    // 1. Ensure real Showtime, Hall, and Seats exist in PostgreSQL database
    let showtime;
    try {
      showtime = await ensureShowtimeInDb(showtimeId);
    } catch (dbErr: any) {
      console.error("[Seats API] Database connection error:", dbErr);
      return NextResponse.json(
        {
          success: false,
          code: "BACKEND_UNAVAILABLE",
          message: "Cinema database is currently offline or unreachable. Cannot load verified seat map.",
        },
        { status: 503 }
      );
    }

    if (!showtime) {
      return NextResponse.json(
        { success: false, message: "Showtime not found" },
        { status: 404 }
      );
    }

    const bookedSeatIds = new Set(showtime.tickets?.map((t: any) => t.seatId) || []);

    // 2. Query Redis for active seat locks using both UUID and label keys
    const lockedSeatIds = new Set<string>();
    try {
      if (showtime.hall?.seats?.length) {
        const seatKeys = showtime.hall.seats.flatMap((s: any) => [
          `lock:${showtime.id}:${s.id}`,
          `lock:${showtimeId}:${s.id}`,
          `seat_lock:${showtime.id}:${s.rowLabel}${s.seatNumber}`,
          `seat_lock:${showtimeId}:${s.rowLabel}${s.seatNumber}`,
        ]);
        const lockedValues = await redis.mget(seatKeys);
        showtime.hall.seats.forEach((seat: any, idx: number) => {
          const baseIdx = idx * 4;
          const isLocked = [0, 1, 2, 3].some(
            (offset) => lockedValues[baseIdx + offset] !== null && lockedValues[baseIdx + offset] !== undefined
          );
          if (isLocked) {
            lockedSeatIds.add(seat.id);
          }
        });
      }
    } catch (redisErr) {
      console.warn("[Seats API] Redis offline or connection failed:", redisErr);
      // Redis is optional for reading, but seat locking will be checked on checkout
    }

    const formattedTime =
      paramTime ||
      (typeof showtime.startTime === "string"
        ? showtime.startTime
        : `Today · ${new Date(showtime.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);

    const seatsWithStatus = (showtime.hall?.seats || []).map((seat: any) => ({
      id: seat.id,
      label: `${seat.rowLabel}${seat.seatNumber}`,
      rowLabel: seat.rowLabel,
      seatNumber: seat.seatNumber,
      gridRow: seat.gridRow,
      gridCol: seat.gridCol,
      type: seat.type,
      status: seat.status,
      priceModifier: Number(seat.priceModifier || 0),
      isBooked: bookedSeatIds.has(seat.id),
      isLocked: lockedSeatIds.has(seat.id),
    }));

    return NextResponse.json({
      success: true,
      data: {
        showtime: {
          id: showtime.id,
          originalId: showtimeId,
          startTime: formattedTime,
          format: paramFormat || showtime.format,
          audioLanguage: showtime.audioLanguage || "VOSTFR",
          basePrice: Number(showtime.basePrice),
          movieTitle: showtime.movie.title,
          movieSlug: showtime.movie.slug,
          hallName: paramHall || showtime.hall.name,
          cinemaName: showtime.hall.cinema?.name || "CinePath Anfa",
          posterUrl: showtime.movie.posterUrl,
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
