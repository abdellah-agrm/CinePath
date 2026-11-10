import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, string> = {
    server: "healthy",
  };

  let allHealthy = true;

  // 1. Check PostgreSQL Database Connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "connected";
  } catch (error) {
    checks.database = "disconnected";
    allHealthy = false;
  }

  // 2. Check Redis Cache / Locking Connectivity
  try {
    const pong = await redis.ping();
    checks.redis = pong === "PONG" ? "connected" : "error";
  } catch (error) {
    checks.redis = "disconnected";
    allHealthy = false;
  }

  const responseTime = Date.now() - startTime;

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      responseTimeMs: responseTime,
      version: "1.0.0",
      services: checks,
    },
    { status: allHealthy ? 200 : 503 }
  );
}

