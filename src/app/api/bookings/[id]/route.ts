import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Booking ID or Reference is required" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id }, { reference: id }],
      },
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
  } catch (error: any) {
    console.error("[Booking By ID API] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to retrieve booking" },
      { status: 500 }
    );
  }
}
