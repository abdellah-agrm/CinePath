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

    const existing = await prisma.movie.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Movie not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.synopsis !== undefined) updateData.synopsis = body.synopsis.trim();
    if (body.durationMin !== undefined) updateData.durationMin = Number(body.durationMin);
    if (body.originalLanguage !== undefined) updateData.originalLanguage = body.originalLanguage;
    if (body.ageRating !== undefined) updateData.ageRating = body.ageRating;
    if (body.releaseDate !== undefined) updateData.releaseDate = new Date(body.releaseDate);
    if (body.posterUrl !== undefined) updateData.posterUrl = body.posterUrl;
    if (body.trailerUrl !== undefined) updateData.trailerUrl = body.trailerUrl;
    if (body.status !== undefined) updateData.status = body.status;

    const updated = await prisma.movie.update({
      where: { id },
      data: updateData,
    });

    await logAuditEvent({
      actorId: admin.sub,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: "MOVIE_UPDATED",
      severity: "INFO",
      entityType: "MOVIE",
      entityId: updated.id,
      message: `Admin updated movie "${updated.title}"`,
      metadata: { previous: existing, updated: updateData },
    });

    return NextResponse.json({
      success: true,
      message: "Movie updated successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("[Admin Movie Update] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update movie" },
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
    const existing = await prisma.movie.findUnique({
      where: { id },
      include: { _count: { select: { showtimes: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Movie not found" },
        { status: 404 }
      );
    }

    // If movie has showtimes with active bookings, soft-archive it instead of hard deleting
    if (existing._count.showtimes > 0) {
      const archived = await prisma.movie.update({
        where: { id },
        data: { status: "ARCHIVED" },
      });

      await logAuditEvent({
        actorId: admin.sub,
        actorEmail: admin.email,
        actorRole: admin.role,
        action: "MOVIE_ARCHIVED",
        severity: "WARN",
        entityType: "MOVIE",
        entityId: id,
        message: `Admin archived movie "${existing.title}" (has ${existing._count.showtimes} existing showtimes)`,
      });

      return NextResponse.json({
        success: true,
        message: "Movie archived successfully (showtimes preserved)",
        data: archived,
      });
    }

    // Hard delete if no showtimes
    await prisma.movie.delete({ where: { id } });

    await logAuditEvent({
      actorId: admin.sub,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: "MOVIE_DELETED",
      severity: "WARN",
      entityType: "MOVIE",
      entityId: id,
      message: `Admin deleted movie "${existing.title}"`,
    });

    return NextResponse.json({
      success: true,
      message: "Movie deleted successfully",
    });
  } catch (error: any) {
    console.error("[Admin Movie Delete] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete movie" },
      { status: 500 }
    );
  }
}
