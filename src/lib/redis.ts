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
 * Atomically lock multiple seats for a showtime
 * @param showtimeId Showtime UUID
 * @param seatIds Array of seat UUIDs
 * @param lockToken Unique token representing this lock session
 * @param ttlSeconds Lock duration in seconds (defaults to 720s / 12 minutes)
 * @returns boolean true if all seats locked successfully, false if any seat was already locked
 */
export async function lockSeatsAtomically(
  showtimeId: string,
  seatIds: string[],
  lockToken: string,
  ttlSeconds = 720
): Promise<boolean> {
  const keys = seatIds.map((id) => `lock:${showtimeId}:${id}`);
  const result = (await redis.eval(
    LOCK_SEATS_LUA,
    keys.length,
    ...keys,
    lockToken,
    ttlSeconds.toString()
  )) as number;

  return result === 1;
}

/**
 * Release seats locked with a specific lockToken
 */
export async function releaseSeats(
  showtimeId: string,
  seatIds: string[],
  lockToken: string
): Promise<void> {
  const pipeline = redis.pipeline();
  for (const seatId of seatIds) {
    const key = `lock:${showtimeId}:${seatId}`;
    pipeline.del(key);
  }
  await pipeline.exec();
}

