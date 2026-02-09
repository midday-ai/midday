import { RedisClient } from "bun";

const KEY_PREFIX = "next-cache:";
const TAG_PREFIX = "next-tag:";

let client = null;

async function getClient() {
  if (client?.connected) return client;
  if (client) return null; // Already tried and failed

  // Skip during build phase
  if (process.env.NEXT_PHASE === "phase-production-build") return null;

  try {
    client = new RedisClient(
      process.env.REDIS_URL ?? "redis://localhost:6379",
    );

    await client.connect();
    return client;
  } catch {
    client = null;
    return null;
  }
}

/** @type {import("next/dist/server/lib/cache-handlers/types").CacheHandler} */
const cacheHandler = {
  async get(cacheKey, softTags) {
    const redis = await getClient();
    if (!redis) return undefined;

    try {
      const stored = await redis.get(`${KEY_PREFIX}${cacheKey}`);
      if (!stored) return undefined;

      const data = JSON.parse(stored);

      const now = Date.now();
      if (now > data.timestamp + data.revalidate * 1000) {
        return undefined;
      }

      return {
        value: new ReadableStream({
          start(controller) {
            controller.enqueue(Buffer.from(data.value, "base64"));
            controller.close();
          },
        }),
        tags: data.tags,
        stale: data.stale,
        timestamp: data.timestamp,
        expire: data.expire,
        revalidate: data.revalidate,
      };
    } catch {
      return undefined;
    }
  },

  async set(cacheKey, pendingEntry) {
    const redis = await getClient();
    if (!redis) return;

    try {
      const entry = await pendingEntry;

      const reader = entry.value.getReader();
      const chunks = [];

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }

      const data = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));

      const serialized = JSON.stringify({
        value: data.toString("base64"),
        tags: entry.tags,
        stale: entry.stale,
        timestamp: entry.timestamp,
        expire: entry.expire,
        revalidate: entry.revalidate,
      });

      await redis.send("SET", [
        `${KEY_PREFIX}${cacheKey}`,
        serialized,
        "EX",
        entry.expire.toString(),
      ]);
    } catch {
      // Silently fail
    }
  },

  async refreshTags() {},

  async getExpiration(tags) {
    const redis = await getClient();
    if (!redis) return 0;

    try {
      const timestamps = await Promise.all(
        tags.map((tag) => redis.get(`${TAG_PREFIX}${tag}`)),
      );

      return Math.max(
        ...timestamps
          .filter(Boolean)
          .map((ts) => Number.parseInt(/** @type {string} */ (ts), 10)),
        0,
      );
    } catch {
      return 0;
    }
  },

  async updateTags(tags) {
    const redis = await getClient();
    if (!redis) return;

    try {
      const now = Date.now();
      await Promise.all(
        tags.map((tag) =>
          redis.send("SET", [
            `${TAG_PREFIX}${tag}`,
            now.toString(),
            "EX",
            (60 * 60 * 24 * 30).toString(),
          ]),
        ),
      );
    } catch {
      // Silently fail
    }
  },
};

export default cacheHandler;
