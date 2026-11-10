import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lockSeatsAtomically } from "@/lib/redis";
import { lockSeatsSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: showtimeId } = await params;
    const body = await request.json();

    const parseResult = lockSeatsSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, errors: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { seatIds, lockToken } = parseResult.data;

    // 1. Verify showtime exists
    const showtime = await prisma.showtime.findUnique({
      where: { id: showtimeId },
    });
    if (!showtime) {
      return NextResponse.json(
        { success: false, message: "Showtime not found" },
        { status: 404 }
      );
    }

    // 2. Check in DB if any seat is already booked/sold
    const alreadySoldTickets = await prisma.ticket.findMany({
      where: {
        showtimeId,
        seatId: { in: seatIds },
        status: { in: ["ACTIVE", "USED"] },
      },
    });

    if (alreadySoldTickets.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "One or more seats have already been booked by another customer",
        },
        { status: 409 }
      );
    }

    // 3. Atomically lock in Redis using Lua script (12 minutes TTL)
    const lockAcquired = await lockSeatsAtomically(
      showtimeId,
      seatIds,
      lockToken,
      720 // 12 minutes in Redis (UI displays 10 minutes)
    );

    if (!lockAcquired) {
      return NextResponse.json(
        {
          success: false,
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
    console.error("Lock seats error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

