import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";

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
    const severity = searchParams.get("severity");
    const entityType = searchParams.get("entityType");
    const search = searchParams.get("search")?.trim();
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 200);
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

    const where: any = {};
    if (severity && ["INFO", "WARN", "CRITICAL"].includes(severity)) {
      where.severity = severity;
    }
    if (entityType && entityType !== "ALL") {
      where.entityType = entityType;
    }
    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
        { actorEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const [logs, total, criticalCount, warnCount, infoCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.count({ where: { severity: "CRITICAL" } }),
      prisma.auditLog.count({ where: { severity: "WARN" } }),
      prisma.auditLog.count({ where: { severity: "INFO" } }),
    ]);

    return NextResponse.json({
      success: true,
      total,
      limit,
      offset,
      summary: {
        critical: criticalCount,
        warn: warnCount,
        info: infoCount,
      },
      data: logs,
    });
  } catch (error: any) {
    console.error("[Admin Logs API] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
