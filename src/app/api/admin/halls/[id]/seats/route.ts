import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET(
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

    const { id: hallId } = await params;
    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        cinema: true,
        seats: {
          orderBy: [{ gridRow: "asc" }, { gridCol: "asc" }],
        },
      },
    });

    if (!hall) {
      return NextResponse.json(
        { success: false, message: "Hall not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        hallId: hall.id,
        hallName: hall.name,
        cinemaName: hall.cinema.name,
        totalRows: hall.totalRows,
        totalCols: hall.totalCols,
        capacity: hall.capacity,
        type: hall.type,
        seats: hall.seats.map((s) => ({
          id: s.id,
          rowLabel: s.rowLabel,
          seatNumber: s.seatNumber,
          gridRow: s.gridRow,
          gridCol: s.gridCol,
          type: s.type,
          status: s.status,
          priceModifier: Number(s.priceModifier),
        })),
      },
    });
  } catch (error: any) {
    console.error("[Admin Hall Seats GET] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch hall seats" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const { id: hallId } = await params;
    const body = await request.json();
    const { seats } = body;

    if (!Array.isArray(seats) || seats.length === 0) {
      return NextResponse.json(
        { success: false, message: "Seats array is required" },
        { status: 400 }
      );
    }

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: { cinema: true, seats: true },
    });

    if (!hall) {
      return NextResponse.json(
        { success: false, message: "Hall not found" },
        { status: 404 }
      );
    }

    const existingSeatsMap = new Map(hall.seats.map((s) => [s.id, s]));
    const newlyBrokenSeats: string[] = [];
    const restoredSeats: string[] = [];

    await prisma.$transaction(
      seats.map((seatUpdate: any) => {
        const prev = existingSeatsMap.get(seatUpdate.id);
        if (prev) {
          if (prev.status !== "BROKEN" && seatUpdate.status === "BROKEN") {
            newlyBrokenSeats.push(`${prev.rowLabel}${prev.seatNumber}`);
          } else if (prev.status === "BROKEN" && seatUpdate.status !== "BROKEN") {
            restoredSeats.push(`${prev.rowLabel}${prev.seatNumber}`);
          }
        }

        const mappedStatus =
          seatUpdate.status === "BROKEN"
            ? "BROKEN"
            : seatUpdate.status === "AISLE" || seatUpdate.type === "AISLE"
            ? "AISLE"
            : "ACTIVE";

        const mappedType =
          seatUpdate.type === "VIP"
            ? "VIP"
            : seatUpdate.type === "WHEELCHAIR"
            ? "WHEELCHAIR"
            : seatUpdate.type === "COUPLE"
            ? "COUPLE"
            : "STANDARD";

        return prisma.seat.update({
          where: { id: seatUpdate.id },
          data: {
            type: mappedType,
            status: mappedStatus,
            priceModifier:
              seatUpdate.priceModifier !== undefined
                ? Number(seatUpdate.priceModifier)
                : undefined,
          },
        });
      })
    );

    // If seats were marked broken, trigger a WARN severity log
    if (newlyBrokenSeats.length > 0) {
      await logAuditEvent({
        actorId: admin.sub,
        actorEmail: admin.email,
        actorRole: admin.role,
        action: "SEAT_MARKED_BROKEN",
        severity: "WARN",
        entityType: "SEAT",
        entityId: hallId,
        message: `Admin marked ${newlyBrokenSeats.length} seat(s) as BROKEN/maintenance in ${hall.name}: [${newlyBrokenSeats.join(", ")}]`,
        metadata: { newlyBrokenSeats, hallName: hall.name },
      });
    }

    if (restoredSeats.length > 0) {
      await logAuditEvent({
        actorId: admin.sub,
        actorEmail: admin.email,
        actorRole: admin.role,
        action: "SEAT_RESTORED_ACTIVE",
        severity: "INFO",
        entityType: "SEAT",
        entityId: hallId,
        message: `Admin restored ${restoredSeats.length} seat(s) to active service in ${hall.name}: [${restoredSeats.join(", ")}]`,
        metadata: { restoredSeats, hallName: hall.name },
      });
    }

    await logAuditEvent({
      actorId: admin.sub,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: "HALL_SEATS_UPDATED",
      severity: "INFO",
      entityType: "HALL",
      entityId: hallId,
      message: `Admin updated seat grid layout for ${hall.name} (${seats.length} seats updated)`,
    });

    return NextResponse.json({
      success: true,
      message: "Hall seats configuration updated successfully",
    });
  } catch (error: any) {
    console.error("[Admin Hall Seats PUT] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update hall seats" },
      { status: 500 }
    );
  }
}
