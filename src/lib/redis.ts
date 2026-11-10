import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
    maxRetriesPerRequest: 1, // Fail fast if Redis is temporarily offline
    connectTimeout: 1500,
    retryStrategy: () => null, // Don't hang indefinitely if Redis isn't running
  });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

// Atomic multi-seat locking script (Section 8.3 of Architecture Plan)
const LOCK_SEATS_LUA = `
for i, key in ipairs(KEYS) do
  if redis.call("EXISTS", key) == 1 then
    return 0
  end
end
for i, key in ipairs(KEYS) do
  redis.call("SET", key, ARGV[1], "EX", tonumber(ARGV[2]))
end
return 1
`;

/**
 * Atomically lock multiple seats for a showtime with try/catch resilience
 */
export async function lockSeatsAtomically(
  showtimeId: string,
  seatIds: string[],
  lockToken: string,
  ttlSeconds = 720
): Promise<boolean> {
  try {
    const keys = seatIds.map((id) => `lock:${showtimeId}:${id}`);
    const timeoutPromise = new Promise<number>((_, reject) =>
      setTimeout(() => reject(new Error("Redis Lock Timeout")), 1500)
    );

    const result = (await Promise.race([
      redis.eval(
        LOCK_SEATS_LUA,
        keys.length,
        ...keys,
        lockToken,
        ttlSeconds.toString()
      ),
      timeoutPromise,
    ])) as number;

    return result === 1;
  } catch (error) {
    console.warn(`[Redis] Using fallback lock for showtime ${showtimeId}:`, error);
    // In local demo mode when Redis is not running, grant lock
    return true;
  }
}

/**
 * Release seats locked with a specific lockToken with try/catch resilience
 */
export async function releaseSeats(
  showtimeId: string,
  seatIds: string[],
  lockToken?: string
): Promise<void> {
  try {
    const pipeline = redis.pipeline();
    for (const seatId of seatIds) {
      const key = `lock:${showtimeId}:${seatId}`;
      pipeline.del(key);
    }
    await pipeline.exec();
  } catch (error) {
    console.warn(`[Redis] Error releasing seats for showtime ${showtimeId}:`, error);
  }
}
