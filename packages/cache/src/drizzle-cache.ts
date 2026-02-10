import { Cache } from "drizzle-orm/cache/core";
import { getSharedRedisClient } from "./shared-redis";

const KEY_PREFIX = "drizzle:";
const TABLE_PREFIX = "drizzle:tbl:";

/**
 * Drizzle ORM cache backed by Bun's RedisClient (Railway Redis, private network).
 *
 * Uses `explicit` strategy by default — queries are only cached when
 * `.$withCache()` is called. Mutations automatically invalidate cached
 * queries for affected tables.
 *
 * Usage:
 *   const db = drizzle(pool, { cache: new BunRedisCache() });
 *
 *   // Opt-in caching per query
 *   const user = await db.select().from(users).where(eq(users.id, id)).$withCache();
 *
 *   // Custom TTL
 *   const rates = await db.select().from(exchangeRates).$withCache({ config: { ex: 3600 } });
 *
 *   // Mutations auto-invalidate (no manual cache.delete needed)
 *   await db.update(users).set({ name: "new" }).where(eq(users.id, id));
 */
export class BunRedisCache extends Cache {
  private defaultTtl: number;

  constructor(defaultTtl = 30 * 60) {
    super();
    this.defaultTtl = defaultTtl;
  }

  private get redis() {
    return getSharedRedisClient();
  }

  override strategy(): "explicit" | "all" {
    return "explicit";
  }

  override async get(
    key: string,
    _tables: string[],
    isTag: boolean,
    _isAutoInvalidate?: boolean,
  ): Promise<any[] | undefined> {
    const redis = this.redis;
    if (!redis) return undefined;

    try {
      const cacheKey = isTag
        ? `${KEY_PREFIX}tag:${key}`
        : `${KEY_PREFIX}${key}`;
      const data = await redis.get(cacheKey);
      if (!data) return undefined;
      return JSON.parse(data);
    } catch {
      return undefined;
    }
  }

  override async put(
    hashedQuery: string,
    response: any,
    tables: string[],
    isTag: boolean,
    config?: { ex?: number },
  ): Promise<void> {
    const redis = this.redis;
    if (!redis) return;

    try {
      const ttl = config?.ex ?? this.defaultTtl;
      const cacheKey = isTag
        ? `${KEY_PREFIX}tag:${hashedQuery}`
        : `${KEY_PREFIX}${hashedQuery}`;

      // Store the cached response
      await redis.send("SETEX", [
        cacheKey,
        ttl.toString(),
        JSON.stringify(response),
      ]);

      // Track which cache keys belong to which tables (for invalidation)
      for (const table of tables) {
        await redis.send("SADD", [`${TABLE_PREFIX}${table}`, cacheKey]);
        // Set expiry on the table tracking set slightly longer than the data TTL
        await redis.send("EXPIRE", [
          `${TABLE_PREFIX}${table}`,
          (ttl + 120).toString(),
        ]);
      }
    } catch {
      // Silently fail — cache errors shouldn't break queries
    }
  }

  override async onMutate(params: {
    tags?: string | string[];
    tables?: any | any[] | string | string[];
  }): Promise<void> {
    const redis = this.redis;
    if (!redis) return;

    try {
      // Invalidate by tags
      if (params.tags) {
        const tags = Array.isArray(params.tags) ? params.tags : [params.tags];
        for (const tag of tags) {
          await redis.del(`${KEY_PREFIX}tag:${tag}`);
        }
      }

      // Invalidate by tables
      if (params.tables) {
        const tables = Array.isArray(params.tables)
          ? params.tables
          : [params.tables];

        for (const table of tables) {
          const tableName =
            typeof table === "string"
              ? table
              : (table[Symbol.for("drizzle:Name")] ?? String(table));

          const tableKey = `${TABLE_PREFIX}${tableName}`;

          // Get all cache keys associated with this table
          const keys: string[] = await redis.send("SMEMBERS", [tableKey]);

          if (keys?.length) {
            // Delete all cached query results for this table
            for (const key of keys) {
              await redis.del(key);
            }
            // Clean up the tracking set
            await redis.del(tableKey);
          }
        }
      }
    } catch {
      // Silently fail — cache errors shouldn't break mutations
    }
  }
}
