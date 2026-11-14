import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { verifyJWT, AUTH_COOKIE_NAME } from "@/lib/auth";
import { generateTicketHmac } from "@/lib/hmac";
import { ensureShowtimeInDb } from "@/lib/db-showtimes";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      showtimeId,
      seats,
      lockToken,
      customerEmail,
      customerName,
      totalAmount,
    } = body;

    // 1. Validate Input
    if (!showtimeId || !Array.isArray(seats) || seats.length === 0) {
      return NextResponse.json(
        { success: false, code: "INVALID_INPUT", message: "Showtime ID and at least one seat are required." },
        { status: 400 }
      );
    }

    if (!customerEmail || !customerEmail.includes("@")) {
      return NextResponse.json(
        { success: false, code: "INVALID_EMAIL", message: "A valid email address is required for ticket delivery." },
        { status: 400 }
      );
    }

    // 2. Check Authentication from HTTP-only Cookie
    let authenticatedUserId: string | null = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
      if (token) {
        const payload = await verifyJWT(token);
        if (payload?.sub) {
          authenticatedUserId = payload.sub;
        }
      }
    } catch {
      // Continue as guest
    }

    // 3. Ensure Showtime & Hall exist in PostgreSQL
    let showtime;
    try {
      showtime = await ensureShowtimeInDb(showtimeId);
    } catch (dbErr: any) {
      console.error("[Bookings API] Database offline:", dbErr);
      return NextResponse.json(
        {
          success: false,
          code: "BACKEND_UNAVAILABLE",
          message: "Cinema database is currently unreachable. Cannot process booking.",
        },
        { status: 503 }
      );
    }

    if (!showtime) {
      return NextResponse.json(
        { success: false, code: "NOT_FOUND", message: "Showtime not found." },
        { status: 404 }
      );
    }

    // 4. Normalize Seat Labels e.g. "Fauteuil A8" -> "A8", "A8" -> "A8"
    const cleanSeatLabels = seats.map((s: string) =>
      s.replace(/^Fauteuil\s+/i, "").replace(/^Seat\s+/i, "").trim().toUpperCase()
    );

    // 5. Verify Redis Distributed Seat Locks
    if (lockToken) {
      try {
        for (const label of cleanSeatLabels) {
          const owner =
            (await redis.get(`seat_lock:${showtime.id}:${label}`)) ||
            (await redis.get(`seat_lock:${showtimeId}:${label}`));

          if (owner && owner !== lockToken) {
            return NextResponse.json(
              {
                success: false,
                code: "SEAT_LOCK_CONFLICT",
                message: `Seat ${label} is currently reserved by another customer.`,
              },
              { status: 409 }
            );
          }
        }
      } catch (redisErr) {
        console.warn("[Bookings API] Redis lock verification bypassed:", redisErr);
      }
    }

    // 6. Match requested seats against Hall Seat records in PostgreSQL
    const hallSeats = showtime.hall.seats || [];
    const matchedSeats = hallSeats.filter((s: any) =>
      cleanSeatLabels.includes(`${s.rowLabel}${s.seatNumber}`.toUpperCase())
    );

    if (matchedSeats.length === 0) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_SEATS",
          message: "Selected seats do not exist in this cinema hall.",
        },
        { status: 400 }
      );
    }

    const brokenOrAisle = matchedSeats.filter((s: any) => s.status === "BROKEN" || s.type === "AISLE");
    if (brokenOrAisle.length > 0) {
      return NextResponse.json(
        {
          success: false,
          code: "SEAT_UNAVAILABLE",
          message: "One or more selected seats are broken or unavailable for booking.",
        },
        { status: 409 }
      );
    }

    // 7. Atomic ACID Transaction in PostgreSQL
    const reference = "CP-" + crypto.randomBytes(3).toString("hex").toUpperCase();
    const finalAmount = Number(totalAmount) > 0 ? Number(totalAmount) : matchedSeats.length * Number(showtime.basePrice);

    let createdBooking: any;
    let createdTickets: any[] = [];
    try {
      createdBooking = await prisma.$transaction(async (tx) => {
        // Check if any seat is already booked/sold
        const conflictingTickets = await tx.ticket.findMany({
          where: {
            showtimeId: showtime.id,
            seatId: { in: matchedSeats.map((s: any) => s.id) },
            status: { in: ["ACTIVE", "USED"] },
          },
        });

        if (conflictingTickets.length > 0) {
          throw new Error("SEAT_ALREADY_BOOKED");
        }

        // Create Booking
        const newBooking = await tx.booking.create({
          data: {
            userId: authenticatedUserId,
            guestEmail: customerEmail,
            showtimeId: showtime.id,
            reference,
            status: "CONFIRMED",
            totalAmount: finalAmount,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });

        // Create Tickets for each seat
        const ticketRows = matchedSeats.map((seat: any) => {
          const ticketId = crypto.randomUUID();
          const seatLabel = `${seat.rowLabel}${seat.seatNumber}`;
          const qrPayload = JSON.stringify({
            ref: reference,
            ticketId,
            showtimeId: showtime.id,
            seat: seatLabel,
            hmac: generateTicketHmac(ticketId, showtime.id, reference),
          });

          return {
            id: ticketId,
            bookingId: newBooking.id,
            seatId: seat.id,
            showtimeId: showtime.id,
            qrPayload,
            price: Number(showtime.basePrice) + Number(seat.priceModifier || 0),
            status: "ACTIVE" as const,
          };
        });

        createdTickets = ticketRows;
        await tx.ticket.createMany({ data: ticketRows });

        // Create Payment record
        await tx.payment.create({
          data: {
            bookingId: newBooking.id,
            providerRef: `pm_${crypto.randomBytes(8).toString("hex")}`,
            amount: finalAmount,
            currency: "MAD",
            status: "SUCCEEDED",
            paidAt: new Date(),
          },
        });

        return newBooking;
      });
    } catch (txError: any) {
      if (txError.message === "SEAT_ALREADY_BOOKED") {
        return NextResponse.json(
          {
            success: false,
            code: "SEAT_ALREADY_SOLD",
            message: "One or more of the selected seats were just purchased by someone else.",
          },
          { status: 409 }
        );
      }
      throw txError;
    }

    // 8. Release Redis seat locks now that the booking is committed
    try {
      for (const label of cleanSeatLabels) {
        await redis.del(`seat_lock:${showtime.id}:${label}`);
        await redis.del(`seat_lock:${showtimeId}:${label}`);
      }
    } catch {
      // Redis cleanup silent
    }

    // 9. Persist audit log
    await logAuditEvent({
      actorId: authenticatedUserId,
      actorEmail: customerEmail,
      actorRole: authenticatedUserId ? "CUSTOMER" : "GUEST",
      action: "BOOKING_CREATED",
      severity: "INFO",
      entityType: "BOOKING",
      entityId: reference,
      message: `Booking ${reference} confirmed for ${matchedSeats.length} seat(s) (${cleanSeatLabels.join(", ")}) on ${showtime.movie.title} (${finalAmount} MAD).`,
      metadata: { bookingRef: reference, showtimeId: showtime.id, seats: cleanSeatLabels, totalAmount: finalAmount },
    });

    // Format formatted time
    const sessionTime =
      typeof showtime.startTime === "string"
        ? showtime.startTime
        : `Today · ${new Date(showtime.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

    return NextResponse.json({
      success: true,
      booking: {
        id: createdBooking.id,
        reference: createdBooking.reference,
        movieTitle: showtime.movie.title,
        cinema: showtime.hall.cinema?.name || "CinePath Anfa",
        hall: showtime.hall.name,
        time: sessionTime,
        format: showtime.format === "IMAX" ? "IMAX 2D · VOSTFR" : "2D · VOSTFR",
        seats: matchedSeats.map((s: any) => `Fauteuil ${s.rowLabel}${s.seatNumber}`),
        seatLabels: matchedSeats.map((s: any) => `${s.rowLabel}${s.seatNumber}`),
        totalAmount: Number(createdBooking.totalAmount),
        posterUrl: showtime.movie.posterUrl,
        customerEmail,
        customerName: customerName || "Guest",
        paidAt: new Date().toISOString(),
        tickets: createdTickets.map((t: any) => ({
          id: t.id,
          seatId: t.seatId,
          qrPayload: t.qrPayload,
        })),
      },
    });
  } catch (error: any) {
    console.error("[Bookings API] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create booking." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    // 1. Direct Reference Lookup
    if (reference) {
      const booking = await prisma.booking.findUnique({
        where: { reference },
        include: {
          showtime: {
            include: {
              movie: true,
              hall: { include: { cinema: true } },
            },
          },
          tickets: {
            include: { seat: true },
          },
          payment: true,
          user: true,
        },
      });

      if (!booking) {
        return NextResponse.json(
          { success: false, message: "Booking not found in cinema records" },
          { status: 404 }
        );
      }

      const sessionTime = `Today · ${new Date(booking.showtime.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      const seatLabels = booking.tickets.map((t) => `${t.seat.rowLabel}${t.seat.seatNumber}`);

      return NextResponse.json({
        success: true,
        booking: {
          id: booking.id,
          reference: booking.reference,
          movieTitle: booking.showtime.movie.title,
          cinema: booking.showtime.hall.cinema?.name || "CinePath Anfa",
          hall: booking.showtime.hall.name,
          time: sessionTime,
          format: booking.showtime.format === "IMAX" ? "IMAX 2D · VOSTFR" : "2D · VOSTFR",
          seats: seatLabels.map((lbl) => `Fauteuil ${lbl}`),
          seatLabels,
          totalAmount: Number(booking.totalAmount),
          posterUrl: booking.showtime.movie.posterUrl,
          status: booking.status,
          paidAt: booking.payment?.paidAt || booking.createdAt,
        },
      });
    }

    // 2. Authenticated User Tickets Listing
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ success: true, bookings: [] });
    }

    const payload = await verifyJWT(token);
    if (!payload?.sub) {
      return NextResponse.json({ success: true, bookings: [] });
    }

    const userBookings = await prisma.booking.findMany({
      where: {
        OR: [
          { userId: payload.sub },
          { guestEmail: payload.email },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        showtime: {
          include: {
            movie: true,
            hall: { include: { cinema: true } },
          },
        },
        tickets: {
          include: { seat: true },
        },
      },
    });

    const formatted = userBookings.map((b) => ({
      id: b.id,
      reference: b.reference,
      movieTitle: b.showtime.movie.title,
      cinema: b.showtime.hall.cinema?.name || "CinePath Anfa",
      hall: b.showtime.hall.name,
      time: `Today · ${new Date(b.showtime.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      seats: b.tickets.map((t) => `Seat ${t.seat.rowLabel}${t.seat.seatNumber}`),
      seatLabels: b.tickets.map((t) => `${t.seat.rowLabel}${t.seat.seatNumber}`),
      totalAmount: Number(b.totalAmount),
      posterUrl: b.showtime.movie.posterUrl,
      status: b.status,
    }));

    return NextResponse.json({ success: true, bookings: formatted });
  } catch (error: any) {
    console.error("[Bookings API GET] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to retrieve bookings." },
      { status: 500 }
    );
  }
}

