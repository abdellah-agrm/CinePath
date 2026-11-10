import { redis } from "@/lib/redis";

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Sliding window rate limiter powered by Redis
 * @param identifier IP address or user ID
 * @param limit Max allowed requests within window
 * @param windowSeconds Window length in seconds (defaults to 60s)
 */
export async function rateLimit(
  identifier: string,
  limit = 20,
  windowSeconds = 60
): Promise<RateLimitResult> {
  const key = `rate_limit:${identifier}`;
  const now = Date.now();
  const clearBefore = now - windowSeconds * 1000;

  try {
    const multi = redis.multi();
    // Remove requests outside the current sliding window
    multi.zremrangebyscore(key, 0, clearBefore);
    // Add current request
    multi.zadd(key, now, `${now}-${Math.random()}`);
    // Count total requests in window
    multi.zcard(key);
    // Set TTL on key
    multi.expire(key, windowSeconds);

    const results = await multi.exec();
    const count = (results?.[2]?.[1] as number) || 0;

    return {
      success: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      reset: Math.ceil(windowSeconds),
    };
  } catch (error) {
    // Fail open in case Redis is temporarily unreachable
    console.warn("Rate limiter Redis failure, allowing request:", error);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: 0,
    };
  }
}

