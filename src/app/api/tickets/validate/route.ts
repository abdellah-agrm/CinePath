import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTicketHmac } from "@/lib/hmac";
import { logAuditEvent } from "@/lib/audit";
import { getSessionUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    const actorId = sessionUser?.sub || null;
    const actorEmail = sessionUser?.email || "turnstile@cinepath.system";
    const actorRole = sessionUser?.role || "STAFF";

    const body = await request.json();
    const qrData = body.qrData || body.code;

    if (!qrData) {
      return NextResponse.json(
        { success: false, code: "INVALID_INPUT", message: "QR data is required" },
        { status: 400 }
      );
    }

    let parsedPayload: any;
    try {
      parsedPayload = typeof qrData === "string" ? JSON.parse(qrData) : qrData;
    } catch {
      await logAuditEvent({
        actorId,
        actorEmail,
        actorRole,
        action: "TICKET_SCAN_MALFORMED",
        severity: "WARN",
        entityType: "TICKET",
        message: "Turnstile Alert: Scanned payload is malformed or unparseable",
        metadata: { rawData: String(qrData).slice(0, 100) },
      });

      return NextResponse.json(
        { success: false, code: "MALFORMED_QR", message: "Malformed QR code payload" },
        { status: 400 }
      );
    }

    const { ref: bookingRef, ticketId, showtimeId, hmac } = parsedPayload;

    // 1. In demo mode or if ticketId is provided, perform HMAC verification
    if (ticketId && showtimeId && hmac) {
      const isValidHmac = verifyTicketHmac(ticketId, showtimeId, bookingRef, hmac);
      if (!isValidHmac) {
        await logAuditEvent({
          actorId,
          actorEmail,
          actorRole,
          action: "TICKET_SCAN_TAMPERED",
          severity: "CRITICAL",
          entityType: "TICKET",
          entityId: ticketId || bookingRef || "UNKNOWN",
          message: `Security Anomaly: Forged or tampered HMAC signature on QR scan! Ref: ${bookingRef || "N/A"}`,
          metadata: { bookingRef, ticketId, showtimeId },
        });

        return NextResponse.json(
          {
            success: false,
            code: "FORGED_QR",
            message: "Tampered or forged QR code! Access Denied.",
          },
          { status: 403 }
        );
      }
    }

    // 2. Fetch ticket from database
    const booking = await prisma.booking.findUnique({
      where: { reference: bookingRef },
      include: {
        showtime: {
          include: {
            movie: true,
            hall: true,
          },
        },
        tickets: {
          include: {
            seat: true,
          },
        },
      },
    });

    if (!booking) {
      await logAuditEvent({
        actorId,
        actorEmail,
        actorRole,
        action: "TICKET_SCAN_NOT_FOUND",
        severity: "WARN",
        entityType: "TICKET",
        entityId: bookingRef || "UNKNOWN",
        message: `Turnstile Alert: Ticket not found in cinema records. Scanned ref: ${bookingRef}`,
        metadata: { bookingRef },
      });

      return NextResponse.json(
        {
          success: false,
          code: "NOT_FOUND",
          message: "Booking does not exist in cinema database records. Access Denied.",
        },
        { status: 404 }
      );
    }

    // 3. Check status
    if (booking.status === "CANCELLED" || booking.status === "REFUNDED") {
      await logAuditEvent({
        actorId,
        actorEmail,
        actorRole,
        action: "TICKET_SCAN_CANCELLED",
        severity: "WARN",
        entityType: "TICKET",
        entityId: booking.reference,
        message: `Turnstile Alert: Attempted entry with ${booking.status} ticket ${booking.reference}`,
        metadata: { bookingRef: booking.reference, status: booking.status },
      });

      return NextResponse.json(
        {
          success: false,
          code: "CANCELLED",
          message: `Ticket was ${booking.status.toLowerCase()} and cannot be used`,
        },
        { status: 409 }
      );
    }

    const activeTickets = booking.tickets.filter((t) => t.status === "ACTIVE");
    const usedTickets = booking.tickets.filter((t) => t.status === "USED");

    if (activeTickets.length === 0 && usedTickets.length > 0) {
      await logAuditEvent({
        actorId,
        actorEmail,
        actorRole,
        action: "TICKET_SCAN_DUPLICATE",
        severity: "WARN",
        entityType: "TICKET",
        entityId: booking.reference,
        message: `Turnstile Alert: Duplicate scan for ticket ${booking.reference}. Already admitted at ${usedTickets[0]?.usedAt?.toLocaleTimeString() || "Earlier"}.`,
        metadata: { bookingRef: booking.reference, usedAt: usedTickets[0]?.usedAt },
      });

      return NextResponse.json(
        {
          success: false,
          code: "ALREADY_USED",
          message: "This ticket has already been scanned and used at the entrance!",
          usedAt: usedTickets[0]?.usedAt?.toLocaleTimeString() || "Earlier",
        },
        { status: 409 }
      );
    }

    // 4. Mark tickets as USED
    await prisma.ticket.updateMany({
      where: { bookingId: booking.id, status: "ACTIVE" },
      data: { status: "USED", usedAt: new Date() },
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "USED" },
    });

    // 5. Log valid scan in audit trail
    const seatLabels = booking.tickets.map((t) => `${t.seat.rowLabel}${t.seat.seatNumber}`);
    await logAuditEvent({
      actorId,
      actorEmail,
      actorRole,
      action: "TICKET_SCAN_VALID",
      severity: "INFO",
      entityType: "TICKET",
      entityId: booking.reference,
      message: `Turnstile: Admission granted for ticket ${booking.reference} (${booking.showtime.movie.title}, ${booking.showtime.hall.name}, Seats: ${seatLabels.join(", ")})`,
      metadata: {
        bookingRef: booking.reference,
        movieTitle: booking.showtime.movie.title,
        hall: booking.showtime.hall.name,
        seats: seatLabels,
      },
    });

    return NextResponse.json({
      success: true,
      code: "VALID",
      message: "Admission Granted",
      ticket: {
        bookingRef: booking.reference,
        movieTitle: booking.showtime.movie.title,
        hallName: booking.showtime.hall.name,
        time: booking.showtime.startTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        seats: seatLabels,
        format: booking.showtime.format,
        status: "USED",
        validatedAt: new Date().toLocaleTimeString(),
      },
    });
  } catch (error) {
    console.error("Ticket validation error:", error);
    return NextResponse.json(
      { success: false, code: "SERVER_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}

