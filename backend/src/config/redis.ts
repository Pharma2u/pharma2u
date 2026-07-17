import Redis, { type RedisOptions } from "ioredis";

function redisOptions(): RedisOptions {
  const useTls =
    process.env.REDIS_TLS === "true" ||
    process.env.REDIS_URL?.startsWith("rediss://") === true;

  return {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 5_000,
    tls: useTls ? {} : undefined,
  };
}

function createRedisClient() {
  const url = process.env.REDIS_URL;
  if (url) return new Redis(url, redisOptions());

  const host = process.env.REDIS_HOST;
  const port = Number(process.env.REDIS_PORT);
  const password = process.env.REDIS_PASSWORD;
  if (
    !host ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65_535 ||
    !password
  ) {
    throw new Error(
      "Set REDIS_URL, or REDIS_HOST, REDIS_PORT, and REDIS_PASSWORD for live rider location tracking.",
    );
  }
  return new Redis({ host, port, password, ...redisOptions() });
}

export const redis = createRedisClient();

redis.on("error", (error) =>
  console.error("Redis connection error:", error.message),
);

export async function connectRedis() {
  if (redis.status === "wait") await redis.connect();
  await redis.ping();
}
