import Redis from "ioredis";

// Lazy redis factory — only instantiates when first used, preventing
// crash on Vercel cold starts if REDIS_URL is not set.
let _redis: Redis | null = null;
let _publisher: Redis | null = null;
let _subscriber: Redis | null = null;

function getRedisUrl(): string {
  return process.env.REDIS_URL || "redis://localhost:6379";
}

function createRedisClient(): Redis {
  const client = new Redis(getRedisUrl(), {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => (times > 2 ? null : Math.min(times * 200, 1000)),
  });
  client.on("error", (err) => {
    // Suppress connection errors in production — features degrade gracefully
    if (process.env.NODE_ENV !== "production") {
      console.error("[Redis] Connection error:", err.message);
    }
  });
  return client;
}

export function getRedis(): Redis {
  if (!_redis) _redis = createRedisClient();
  return _redis;
}

export function getPublisher(): Redis {
  if (!_publisher) _publisher = createRedisClient();
  return _publisher;
}

export function getSubscriber(): Redis {
  if (!_subscriber) _subscriber = createRedisClient();
  return _subscriber;
}

// Legacy named exports for backward compatibility
export const redis = new Proxy({} as Redis, {
  get: (_t, prop) => {
    const client = getRedis();
    const val = (client as any)[prop];
    return typeof val === "function" ? val.bind(client) : val;
  },
});
