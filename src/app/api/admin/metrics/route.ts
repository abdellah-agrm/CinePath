import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { verifyJWT, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function GET() {
  try {
    // 1. RBAC Guard: Admin Only
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin credentials required." },
        { status: 401 }
      );
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // 2. Query Real Metrics from PostgreSQL
    const [revenueAgg, ticketsSoldCount, bookingsCount, totalSeatsCount] =
      await Promise.all([
        prisma.payment.aggregate({
          where: { status: "SUCCEEDED" },
          _sum: { amount: true },
        }),
        prisma.ticket.count({
          where: { status: { in: ["ACTIVE", "USED"] } },
        }),
        prisma.booking.count(),
        prisma.seat.count({
          where: { status: "ACTIVE" },
        }),
      ]);

    const totalRevenue = Number(revenueAgg._sum.amount || 0);

    // 3. Query Active Redis Seat Locks
    let activeSeatLocks = 0;
    try {
      const keys = await redis.keys("seat_lock:*");
      activeSeatLocks = keys.length;
    } catch (redisErr) {
      console.warn("[Admin Metrics] Redis keys query warning:", redisErr);
    }

    // Calculate Occupancy
    const totalCapacity = totalSeatsCount > 0 ? totalSeatsCount : 100;
    const occupancyRate =
      totalCapacity > 0
        ? Math.min(100, Math.round((ticketsSoldCount / totalCapacity) * 1000) / 10)
        : 0;

    // 4. Top Performing Movies from Database
    const moviesWithBookings = await prisma.movie.findMany({
      include: {
        showtimes: {
          include: {
            tickets: {
              where: { status: { in: ["ACTIVE", "USED"] } },
            },
          },
        },
      },
      take: 5,
    });

    const topMovies = moviesWithBookings.map((m) => {
      const ticketsSold = m.showtimes.reduce((acc, st) => acc + st.tickets.length, 0);
      const rev = m.showtimes.reduce(
        (acc, st) =>
          acc + st.tickets.reduce((sub, t) => sub + Number(t.price), 0),
        0
      );
      return {
        id: m.id,
        title: m.title,
        posterUrl: m.posterUrl,
        ticketsSold,
        revenue: rev,
      };
    });

    // 5. Active Showtimes
    const activeShowtimes = await prisma.showtime.findMany({
      take: 6,
      orderBy: { startTime: "asc" },
      include: {
        movie: true,
        hall: true,
        tickets: true,
      },
    });

    const showtimesFormatted = activeShowtimes.map((st) => ({
      id: st.id,
      movieTitle: st.movie.title,
      hallName: st.hall.name,
      time: new Date(st.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      format: st.format,
      basePrice: Number(st.basePrice),
      soldCount: st.tickets.length,
      capacity: st.hall.capacity,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        occupancyRate,
        ticketsSoldCount,
        bookingsCount,
        activeSeatLocks,
        topMovies,
        showtimes: showtimesFormatted,
      },
    });
  } catch (error: any) {
    console.error("[Admin Metrics API] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load admin metrics." },
      { status: 500 }
    );
  }
}

