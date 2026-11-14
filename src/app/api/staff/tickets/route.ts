import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const staff = await requireStaffSession();
    if (!staff) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Staff or Admin role required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 100);

    const where: any = {};
    if (status && ["ACTIVE", "USED", "CANCELLED", "REFUNDED"].includes(status)) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { booking: { reference: { contains: search, mode: "insensitive" } } },
        { booking: { guestEmail: { contains: search, mode: "insensitive" } } },
        { booking: { user: { email: { contains: search, mode: "insensitive" } } } },
        { showtime: { movie: { title: { contains: search, mode: "insensitive" } } } },
        { seat: { rowLabel: { equals: search.toUpperCase() } } },
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        booking: {
          select: {
            reference: true,
            guestEmail: true,
            createdAt: true,
            user: { select: { email: true, fullName: true } },
          },
        },
        seat: {
          select: { rowLabel: true, seatNumber: true, type: true, status: true },
        },
        showtime: {
          select: {
            startTime: true,
            format: true,
            movie: { select: { title: true, posterUrl: true } },
            hall: {
              select: {
                name: true,
                cinema: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { booking: { createdAt: "desc" } },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      count: tickets.length,
      data: tickets.map((t) => ({
        id: t.id,
        bookingRef: t.booking.reference,
        customerEmail: t.booking.user?.email || t.booking.guestEmail || "Guest",
        customerName: t.booking.user?.fullName || "Guest",
        movieTitle: t.showtime.movie.title,
        posterUrl: t.showtime.movie.posterUrl,
        hallName: t.showtime.hall.name,
        cinemaName: t.showtime.hall.cinema.name,
        seatLabel: `${t.seat.rowLabel}${t.seat.seatNumber}`,
        seatType: t.seat.type,
        seatStatus: t.seat.status,
        format: t.showtime.format,
        startTime: t.showtime.startTime,
        price: Number(t.price),
        status: t.status,
        usedAt: t.usedAt,
      })),
    });
  } catch (error: any) {
    console.error("[Staff Tickets GET] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const staff = await requireStaffSession();
    if (!staff) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Staff or Admin role required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { ticketId, newStatus, reason = "Staff manual intervention" } = body;

    if (!ticketId || !["ACTIVE", "USED", "CANCELLED"].includes(newStatus)) {
      return NextResponse.json(
        { success: false, message: "Valid ticketId and newStatus (ACTIVE, USED, CANCELLED) are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        booking: true,
        seat: true,
        showtime: { include: { movie: true, hall: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Ticket not found" }, { status: 404 });
    }

    const updateData: any = { status: newStatus };
    if (newStatus === "USED") {
      updateData.usedAt = new Date();
    } else if (newStatus === "ACTIVE") {
      updateData.usedAt = null;
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
    });

    // Determine audit action and severity
    const action =
      newStatus === "USED"
        ? "TICKET_MANUAL_CHECKIN"
        : newStatus === "ACTIVE"
        ? "TICKET_RESET_ACTIVE"
        : "TICKET_CANCELLED";

    const severity = newStatus === "USED" ? "INFO" : "WARN";

    await logAuditEvent({
      actorId: staff.sub,
      actorEmail: staff.email,
      actorRole: staff.role,
      action,
      severity,
      entityType: "TICKET",
      entityId: ticketId,
      message: `${staff.role} ${staff.email} changed ticket #${existing.booking.reference} (${existing.seat.rowLabel}${existing.seat.seatNumber}) status from ${existing.status} to ${newStatus}. Reason: ${reason}`,
      metadata: {
        ticketId,
        bookingRef: existing.booking.reference,
        seat: `${existing.seat.rowLabel}${existing.seat.seatNumber}`,
        movie: existing.showtime.movie.title,
        hall: existing.showtime.hall.name,
        previousStatus: existing.status,
        newStatus,
        reason,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Ticket status successfully changed to ${newStatus}`,
      data: updated,
    });
  } catch (error: any) {
    console.error("[Staff Ticket PATCH] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update ticket" },
      { status: 500 }
    );
  }
}
