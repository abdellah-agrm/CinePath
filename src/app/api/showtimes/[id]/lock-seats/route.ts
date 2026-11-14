import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lockSeatsAtomically } from "@/lib/redis";
import { lockSeatsSchema } from "@/lib/validations";
import { ensureShowtimeInDb } from "@/lib/db-showtimes";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: showtimeId } = await params;
    let body: any;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const parseResult = lockSeatsSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, errors: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { seatIds, lockToken } = parseResult.data;

    // 1. Verify showtime & sold / broken seats in DB
    try {
      const showtime = await ensureShowtimeInDb(showtimeId);

      if (showtime) {
        const cleanRequestedLabels = seatIds.map((s: string) =>
          s.replace(/^Fauteuil\s+/i, "").replace(/^Seat\s+/i, "").trim().toUpperCase()
        );

        const hallSeats = showtime.hall?.seats || [];
        const requestedSeatRecords = hallSeats.filter(
          (s: any) =>
            seatIds.includes(s.id) ||
            cleanRequestedLabels.includes(`${s.rowLabel}${s.seatNumber}`.toUpperCase())
        );

        // Check broken or aisle seats
        const brokenOrAisle = requestedSeatRecords.filter(
          (s: any) => s.status === "BROKEN" || s.type === "AISLE"
        );
        if (brokenOrAisle.length > 0) {
          return NextResponse.json(
            {
              success: false,
              code: "SEAT_UNAVAILABLE",
              message: "One or more selected seats are broken or out of service.",
            },
            { status: 409 }
          );
        }

        // Check already sold tickets in DB
        const requestedSeatDbIds = requestedSeatRecords.map((s: any) => s.id);
        const alreadySoldTickets = await prisma.ticket.findMany({
          where: {
            showtimeId: showtime.id,
            seatId: { in: requestedSeatDbIds },
            status: { in: ["ACTIVE", "USED"] },
          },
        });

        if (alreadySoldTickets.length > 0) {
          return NextResponse.json(
            {
              success: false,
              code: "SEAT_ALREADY_BOOKED",
              message: "One or more seats have already been booked by another customer",
            },
            { status: 409 }
          );
        }
      }
    } catch (dbError) {
      console.warn("[Lock Seats API] DB check error or fallback:", dbError);
    }

    // 2. Atomically lock in Redis using Lua script (12 minutes TTL)
    let lockAcquired = false;
    try {
      lockAcquired = await lockSeatsAtomically(
        showtimeId,
        seatIds,
        lockToken,
        720 // 12 minutes in Redis (UI displays 10 minutes)
      );
    } catch (redisError: any) {
      console.error("[Lock Seats API] Redis offline or connection failed:", redisError);
      return NextResponse.json(
        {
          success: false,
          code: "SEAT_LOCK_SERVICE_UNAVAILABLE",
          message: "Real-time seat reservation service is currently offline. Please try again shortly.",
        },
        { status: 503 }
      );
    }

    if (!lockAcquired) {
      return NextResponse.json(
        {
          success: false,
          code: "LOCK_CONFLICT",
          message: "One or more selected seats are currently being held by someone else",
        },
        { status: 409 }
      );
    }

    // Return 10-minute expiry timestamp for UI timer
    const uiExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    return NextResponse.json({
      success: true,
      message: "Seats locked successfully",
      data: {
        lockToken,
        showtimeId,
        seatIds,
        expiresAt: uiExpiresAt,
      },
    });
  } catch (error) {
    console.error("[Lock Seats API] Unexpected error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
