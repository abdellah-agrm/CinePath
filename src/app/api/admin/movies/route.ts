import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { slugify } from "@/lib/tmdb";

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
    const search = searchParams.get("search")?.toLowerCase().trim();
    const status = searchParams.get("status");

    const where: any = {};
    if (status && ["NOW_SHOWING", "COMING_SOON", "ARCHIVED"].includes(status)) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    const movies = await prisma.movie.findMany({
      where,
      include: {
        genres: { include: { genre: true } },
        _count: { select: { showtimes: true, reviews: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      count: movies.length,
      data: movies.map((m) => ({
        id: m.id,
        title: m.title,
        slug: m.slug,
        synopsis: m.synopsis,
        durationMin: m.durationMin,
        originalLanguage: m.originalLanguage,
        ageRating: m.ageRating,
        releaseDate: m.releaseDate,
        posterUrl: m.posterUrl,
        trailerUrl: m.trailerUrl,
        status: m.status,
        createdAt: m.createdAt,
        showtimesCount: m._count.showtimes,
        genres: m.genres.map((g) => g.genre.name),
      })),
    });
  } catch (error: any) {
    console.error("[Admin Movies API] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch movies" },
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
      title,
      synopsis,
      durationMin,
      originalLanguage = "fr",
      ageRating = "12+",
      releaseDate,
      posterUrl,
      trailerUrl,
      status = "NOW_SHOWING",
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: "Movie title is required" },
        { status: 400 }
      );
    }

    const baseSlug = slugify(title);
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await prisma.movie.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    const movie = await prisma.movie.create({
      data: {
        title: title.trim(),
        slug: uniqueSlug,
        synopsis: synopsis?.trim() || `Experience ${title} at CinePath.`,
        durationMin: Number(durationMin) || 120,
        originalLanguage,
        ageRating,
        releaseDate: releaseDate ? new Date(releaseDate) : new Date(),
        posterUrl: posterUrl || "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
        trailerUrl: trailerUrl || null,
        status: status as any,
      },
    });

    await logAuditEvent({
      actorId: admin.sub,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: "MOVIE_CREATED",
      severity: "INFO",
      entityType: "MOVIE",
      entityId: movie.id,
      message: `Admin created movie "${movie.title}" (${movie.slug})`,
      metadata: { movie },
    });

    return NextResponse.json({
      success: true,
      message: "Movie created successfully",
      data: movie,
    });
  } catch (error: any) {
    console.error("[Admin Movie Create] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create movie" },
      { status: 500 }
    );
  }
}
