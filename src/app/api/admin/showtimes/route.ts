import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin role required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get("movieId");
    const hallId = searchParams.get("hallId");
    const status = searchParams.get("status");

    const where: any = {};
    if (movieId) where.movieId = movieId;
    if (hallId) where.hallId = hallId;
    if (status) where.status = status;

    const showtimes = await prisma.showtime.findMany({
      where,
      include: {
        movie: { select: { id: true, title: true, slug: true, durationMin: true, posterUrl: true } },
        hall: {
          select: {
            id: true,
            name: true,
            capacity: true,
            type: true,
            cinema: { select: { id: true, name: true, city: true } },
          },
        },
        _count: { select: { tickets: true, bookings: true } },
      },
      orderBy: { startTime: "desc" },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      count: showtimes.length,
      data: showtimes.map((s) => ({
        id: s.id,
        movieId: s.movieId,
        movieTitle: s.movie.title,
        movieSlug: s.movie.slug,
        posterUrl: s.movie.posterUrl,
        hallId: s.hallId,
        hallName: s.hall.name,
        cinemaName: s.hall.cinema.name,
        capacity: s.hall.capacity,
        ticketsSold: s._count.tickets,
        startTime: s.startTime,
        endTime: s.endTime,
        basePrice: Number(s.basePrice),
        format: s.format,
        audioLanguage: s.audioLanguage,
        subtitleLanguage: s.subtitleLanguage,
        status: s.status,
      })),
    });
  } catch (error: any) {
    console.error("[Admin Showtimes GET] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch showtimes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin role required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      movieId,
      hallId,
      startTime,
      basePrice = 90.0,
      format = "TWO_D",
      audioLanguage = "VOSTFR",
      subtitleLanguage = "FR",
    } = body;

    if (!movieId || !hallId || !startTime) {
      return NextResponse.json(
        { success: false, message: "Movie, Hall, and Start Time are required" },
        { status: 400 }
      );
    }

    const movie = await prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) {
      return NextResponse.json({ success: false, message: "Movie not found" }, { status: 404 });
    }

    const hall = await prisma.hall.findUnique({ where: { id: hallId }, include: { cinema: true } });
    if (!hall) {
      return NextResponse.json({ success: false, message: "Hall not found" }, { status: 404 });
    }

    const start = new Date(startTime);
    const durationMin = movie.durationMin || 120;
    const end = new Date(start.getTime() + durationMin * 60 * 1000);

    const mappedFormat =
      format === "IMAX" || format === "IMAX_2D" || format === "IMAX_3D"
        ? "IMAX"
        : format === "THREE_D"
        ? "THREE_D"
        : "TWO_D";

    const showtime = await prisma.showtime.create({
      data: {
        movieId,
        hallId,
        startTime: start,
        endTime: end,
        basePrice: Number(basePrice),
        format: mappedFormat,
        audioLanguage,
        subtitleLanguage,
        status: "SCHEDULED",
      },
    });

    await logAuditEvent({
      actorId: admin.sub,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: "SHOWTIME_CREATED",
      severity: "INFO",
      entityType: "SHOWTIME",
      entityId: showtime.id,
      message: `Admin scheduled showtime for "${movie.title}" in ${hall.name} on ${start.toISOString()} at ${basePrice} MAD`,
      metadata: { showtime, movieTitle: movie.title, hallName: hall.name },
    });

    return NextResponse.json({
      success: true,
      message: "Showtime scheduled successfully",
      data: showtime,
    });
  } catch (error: any) {
    console.error("[Admin Showtime Create] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to schedule showtime" },
      { status: 500 }
    );
  }
}
