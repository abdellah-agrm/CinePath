import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin role required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.showtime.findUnique({
      where: { id },
      include: { movie: true, hall: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Showtime not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (body.basePrice !== undefined) updateData.basePrice = Number(body.basePrice);
    if (body.startTime !== undefined) {
      const start = new Date(body.startTime);
      updateData.startTime = start;
      const durationMin = existing.movie.durationMin || 120;
      updateData.endTime = new Date(start.getTime() + durationMin * 60 * 1000);
    }
    if (body.format !== undefined) updateData.format = body.format;
    if (body.audioLanguage !== undefined) updateData.audioLanguage = body.audioLanguage;
    if (body.subtitleLanguage !== undefined) updateData.subtitleLanguage = body.subtitleLanguage;
    if (body.status !== undefined) updateData.status = body.status;

    const updated = await prisma.showtime.update({
      where: { id },
      data: updateData,
    });

    const isCancelled = body.status === "CANCELLED";

    await logAuditEvent({
      actorId: admin.sub,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: isCancelled ? "SHOWTIME_CANCELLED" : "SHOWTIME_UPDATED",
      severity: isCancelled ? "WARN" : "INFO",
      entityType: "SHOWTIME",
      entityId: id,
      message: `Admin ${isCancelled ? "cancelled" : "updated"} showtime for "${existing.movie.title}" in ${existing.hall.name}`,
      metadata: { previous: existing, updated: updateData },
    });

    return NextResponse.json({
      success: true,
      message: "Showtime updated successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("[Admin Showtime PATCH] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update showtime" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin role required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await prisma.showtime.findUnique({
      where: { id },
      include: {
        movie: true,
        hall: true,
        _count: { select: { tickets: true, bookings: true } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Showtime not found" },
        { status: 404 }
      );
    }

    // If tickets have already been sold, mark as CANCELLED rather than deleting foreign keys
    if (existing._count.tickets > 0) {
      const cancelled = await prisma.showtime.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      await logAuditEvent({
        actorId: admin.sub,
        actorEmail: admin.email,
        actorRole: admin.role,
        action: "SHOWTIME_CANCELLED",
        severity: "WARN",
        entityType: "SHOWTIME",
        entityId: id,
        message: `Admin cancelled showtime for "${existing.movie.title}" (has ${existing._count.tickets} sold tickets)`,
      });

      return NextResponse.json({
        success: true,
        message: "Showtime marked as CANCELLED (tickets preserved for refund audit)",
        data: cancelled,
      });
    }

    await prisma.showtime.delete({ where: { id } });

    await logAuditEvent({
      actorId: admin.sub,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: "SHOWTIME_DELETED",
      severity: "WARN",
      entityType: "SHOWTIME",
      entityId: id,
      message: `Admin deleted showtime for "${existing.movie.title}" in ${existing.hall.name}`,
    });

    return NextResponse.json({
      success: true,
      message: "Showtime deleted successfully",
    });
  } catch (error: any) {
    console.error("[Admin Showtime DELETE] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete showtime" },
      { status: 500 }
    );
  }
}
