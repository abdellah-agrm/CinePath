import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin role required." },
        { status: 403 }
      );
    }

    const cinemas = await prisma.cinema.findMany({
      include: {
        halls: {
          include: {
            seats: {
              select: { id: true, status: true, type: true },
            },
            _count: { select: { showtimes: true } },
          },
          orderBy: { name: "asc" },
        },
      },
    });

    const formatted = cinemas.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      city: c.city,
      address: c.address,
      halls: c.halls.map((h) => {
        const totalSeats = h.seats.length;
        const brokenSeats = h.seats.filter((s) => s.status === "BROKEN").length;
        const aisleSeats = h.seats.filter((s) => s.status === "AISLE").length;
        const vipSeats = h.seats.filter((s) => s.type === "VIP").length;
        const wheelchairSeats = h.seats.filter((s) => s.type === "WHEELCHAIR").length;
        const usableSeats = totalSeats - brokenSeats - aisleSeats;

        return {
          id: h.id,
          cinemaId: h.cinemaId,
          cinemaName: c.name,
          name: h.name,
          totalRows: h.totalRows,
          totalCols: h.totalCols,
          capacity: h.capacity,
          type: h.type,
          showtimesCount: h._count.showtimes,
          stats: {
            total: totalSeats,
            usable: usableSeats,
            broken: brokenSeats,
            aisle: aisleSeats,
            vip: vipSeats,
            wheelchair: wheelchairSeats,
          },
        };
      }),
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error("[Admin Halls API] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch halls" },
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
    const { cinemaId, name, totalRows = 6, totalCols = 10, type = "STANDARD" } = body;

    if (!cinemaId || !name) {
      return NextResponse.json(
        { success: false, message: "Cinema ID and Hall name are required" },
        { status: 400 }
      );
    }

    const rowsNum = Math.min(Math.max(Number(totalRows) || 6, 3), 12);
    const colsNum = Math.min(Math.max(Number(totalCols) || 10, 4), 16);
    const capacity = rowsNum * colsNum;

    const hall = await prisma.$transaction(async (tx) => {
      const createdHall = await tx.hall.create({
        data: {
          cinemaId,
          name: name.trim(),
          totalRows: rowsNum,
          totalCols: colsNum,
          capacity,
          type: type as any,
        },
      });

      // Generate seats
      const seatsData = [];
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      for (let r = 0; r < rowsNum; r++) {
        const rowLabel = alphabet[r];
        const isVipRow = r >= rowsNum - 2;
        for (let c = 1; c <= colsNum; c++) {
          const isAisle = c === Math.floor(colsNum / 2);
          seatsData.push({
            hallId: createdHall.id,
            rowLabel,
            seatNumber: c,
            gridRow: r + 1,
            gridCol: c,
            type: isVipRow ? ("VIP" as const) : ("STANDARD" as const),
            status: isAisle ? ("AISLE" as const) : ("ACTIVE" as const),
            priceModifier: isVipRow ? 30.0 : 0.0,
          });
        }
      }

      await tx.seat.createMany({ data: seatsData });
      return createdHall;
    });

    await logAuditEvent({
      actorId: admin.sub,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: "HALL_CREATED",
      severity: "INFO",
      entityType: "HALL",
      entityId: hall.id,
      message: `Admin created Salle/Hall "${hall.name}" (${rowsNum}x${colsNum}, ${capacity} capacity)`,
    });

    return NextResponse.json({
      success: true,
      message: "Hall created successfully",
      data: hall,
    });
  } catch (error: any) {
    console.error("[Admin Hall Create] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create hall" },
      { status: 500 }
    );
  }
}
