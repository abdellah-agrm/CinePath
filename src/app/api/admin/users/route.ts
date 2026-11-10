import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT, AUTH_COOKIE_NAME, DEMO_USERS, UserRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function verifyAdminAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    const payload = await verifyJWT(token);
    if (!payload || payload.role !== "ADMIN") return null;
    return payload;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const admin = await verifyAdminAuth();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin privileges required." },
        { status: 403 }
      );
    }

    try {
      const users = await Promise.race([
        prisma.user.findMany({
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            createdAt: true,
            _count: {
              select: { bookings: true },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("DB Timeout")), 1500)
        ),
      ]);

      const formatted = users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        bookingsCount: u._count.bookings,
      }));

      return NextResponse.json({ success: true, data: formatted });
    } catch (dbError) {
      console.warn("[Admin Users] DB offline, serving demo user list");
      const demoList = DEMO_USERS.map((u, i) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        createdAt: new Date(Date.now() - i * 86400000),
        bookingsCount: i * 2,
      }));
      return NextResponse.json({ success: true, data: demoList });
    }
  } catch (error: any) {
    console.error("[Admin Users API] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await verifyAdminAuth();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin privileges required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, newRole } = body;

    if (!userId || !["CUSTOMER", "STAFF", "ADMIN"].includes(newRole)) {
      return NextResponse.json(
        { success: false, error: "Invalid userId or role specified." },
        { status: 400 }
      );
    }

    try {
      const updated = await Promise.race([
        prisma.user.update({
          where: { id: userId },
          data: { role: newRole as any },
          select: { id: true, email: true, role: true },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("DB Timeout")), 1500)
        ),
      ]);

      return NextResponse.json({
        success: true,
        message: `User role updated to ${newRole}`,
        data: updated,
      });
    } catch (dbError) {
      console.warn("[Admin Users PATCH] DB offline, simulating role update");
      return NextResponse.json({
        success: true,
        message: `User role updated to ${newRole} (Simulated)`,
        data: { id: userId, role: newRole },
      });
    }
  } catch (error: any) {
    console.error("[Admin Users PATCH] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update role" },
      { status: 500 }
    );
  }
}

