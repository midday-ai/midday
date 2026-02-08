import { createClient } from "redis";

const client = createClient({
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
});

client.on("error", (err) => {
  console.error("[CacheHandler] Redis error:", err.message);
});

await client.connect().catch((err) => {
  console.warn("[CacheHandler] Failed to connect to Redis:", err.message);
});

const KEY_PREFIX = "next-cache:";
const TAG_PREFIX = "next-tag:";

/** @type {import("next/dist/server/lib/cache-handlers/types").CacheHandler} */
const cacheHandler = {
  async get(cacheKey, softTags) {
    if (!client.isReady) return undefined;

    try {
      const stored = await client.get(`${KEY_PREFIX}${cacheKey}`);
      if (!stored) return undefined;

      const data = JSON.parse(stored);

      // Check if entry has expired
      const now = Date.now();
      if (now > data.timestamp + data.revalidate * 1000) {
        return undefined;
      }

      // Reconstruct the ReadableStream from stored data
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
    if (!client.isReady) return;

    try {
      const entry = await pendingEntry;

      // Read the stream to get the data
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

      // Combine chunks and serialize for Redis storage
      const data = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));

      await client.set(
        `${KEY_PREFIX}${cacheKey}`,
        JSON.stringify({
          value: data.toString("base64"),
          tags: entry.tags,
          stale: entry.stale,
          timestamp: entry.timestamp,
          expire: entry.expire,
          revalidate: entry.revalidate,
        }),
        { EX: entry.expire },
      );
    } catch {
      // Silently fail - cache miss is better than a crash
    }
  },

  async refreshTags() {
    // No-op - tag state is stored in Redis and always fresh
  },

  async getExpiration(tags) {
    if (!client.isReady) return 0;

    try {
      const timestamps = await Promise.all(
        tags.map((tag) => client.get(`${TAG_PREFIX}${tag}`)),
      );

      const maxTimestamp = Math.max(
        ...timestamps
          .filter(Boolean)
          .map((ts) => Number.parseInt(/** @type {string} */ (ts), 10)),
        0,
      );

      return maxTimestamp;
    } catch {
      return 0;
    }
  },

  async updateTags(tags) {
    if (!client.isReady) return;

    try {
      const now = Date.now();
      await Promise.all(
        tags.map((tag) =>
          client.set(`${TAG_PREFIX}${tag}`, now.toString(), {
            EX: 60 * 60 * 24 * 30, // 30 days
          }),
        ),
      );
    } catch {
      // Silently fail
    }
  },
};

export default cacheHandler;
