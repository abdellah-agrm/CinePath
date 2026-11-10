import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, string> = {
    server: "healthy",
  };

  let allHealthy = true;

  // 1. Check PostgreSQL Database Connectivity with fast 1.5s timeout
  try {
    const dbTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("DB Timeout")), 1500)
    );
    await Promise.race([prisma.$queryRaw`SELECT 1`, dbTimeout]);
    checks.database = "connected";
  } catch {
    checks.database = "disconnected";
    allHealthy = false;
  }

  // 2. Check Redis Cache / Locking Connectivity with fast 1.5s timeout
  try {
    const redisTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Redis Timeout")), 1500)
    );
    const pong = await Promise.race([redis.ping(), redisTimeout]);
    checks.redis = pong === "PONG" ? "connected" : "error";
  } catch {
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
