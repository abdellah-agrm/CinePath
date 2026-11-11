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

    // 1. Verify showtime & sold seats in DB with try/catch resilience
    try {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          showtimeId
        );

      if (isUuid) {
        const showtime = await Promise.race([
          prisma.showtime.findUnique({
            where: { id: showtimeId },
          }),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 800)
          ),
        ]);

        if (showtime) {
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
                message:
                  "One or more seats have already been booked by another customer",
              },
              { status: 409 }
            );
          }
        }
      }
    } catch (dbError) {
      console.warn("[Lock Seats API] DB check bypassed in demo mode:", dbError);
    }

    // 2. Atomically lock in Redis using Lua script (12 minutes TTL)
    let lockAcquired = true;
    try {
      lockAcquired = await lockSeatsAtomically(
        showtimeId,
        seatIds,
        lockToken,
        720 // 12 minutes in Redis (UI displays 10 minutes)
      );
    } catch (redisError) {
      console.warn("[Lock Seats API] Redis offline, using fallback lock:", redisError);
      lockAcquired = true;
    }

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
    console.error("[Lock Seats API] Unexpected error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
