/**
 * Adapter that wraps Bun's native RedisClient to satisfy the interface
 * expected by @ai-sdk-tools/memory's RedisProvider (node-redis detection).
 *
 * RedisProvider checks `"setEx" in client` to decide it's a node-redis
 * client, then calls PascalCase methods like setEx, rPush, hSet, etc.
 * This adapter maps those to Bun's `send()`.
 *
 * Every method calls getSharedRedisClient() fresh so it always uses the
 * current singleton. If the old client died and was recreated, the adapter
 * picks up the new one automatically.
 */
import { getSharedRedisClient } from "./shared-redis";

export interface NodeRedisAdapter {
  get(key: string): Promise<string | null>;
  setEx(key: string, seconds: number, value: string): Promise<unknown>;
  rPush(key: string, ...values: string[]): Promise<number>;
  lTrim(key: string, start: number, stop: number): Promise<unknown>;
  lRange(key: string, start: number, stop: number): Promise<string[]>;
  hSet(key: string, data: Record<string, unknown>): Promise<number>;
  hGetAll(key: string): Promise<Record<string, string>>;
  zAdd(key: string, member: { score: number; value: string }): Promise<number>;
  zRange(key: string, start: number, stop: number): Promise<string[]>;
  zRem(key: string, member: string): Promise<number>;
  expire(key: string, seconds: number): Promise<boolean>;
  keys(pattern: string): Promise<string[]>;
  del(key: string): Promise<number>;
}

function flattenHash(data: Record<string, unknown>): string[] {
  const pairs: string[] = [];
  for (const [field, value] of Object.entries(data)) {
    pairs.push(field, String(value));
  }
  return pairs;
}

function arrayToRecord(arr: unknown): Record<string, string> {
  if (arr && typeof arr === "object" && !Array.isArray(arr)) {
    return arr as Record<string, string>;
  }
  if (!Array.isArray(arr)) return {};
  const record: Record<string, string> = {};
  for (let i = 0; i < arr.length; i += 2) {
    record[String(arr[i])] = String(arr[i + 1]);
  }
  return record;
}

/**
 * Create an adapter around the shared Bun RedisClient that is compatible
 * with @ai-sdk-tools/memory's RedisProvider (detected as node-redis).
 */
export function createRedisAdapter(): NodeRedisAdapter {
  return {
    async get(key: string): Promise<string | null> {
      return getSharedRedisClient().get(key);
    },

    async setEx(key: string, seconds: number, value: string): Promise<unknown> {
      return getSharedRedisClient().send("SETEX", [
        key,
        String(seconds),
        value,
      ]);
    },

    async rPush(key: string, ...values: string[]): Promise<number> {
      const result = await getSharedRedisClient().send("RPUSH", [
        key,
        ...values,
      ]);
      return Number(result);
    },

    async lTrim(key: string, start: number, stop: number): Promise<unknown> {
      return getSharedRedisClient().send("LTRIM", [
        key,
        String(start),
        String(stop),
      ]);
    },

    async lRange(key: string, start: number, stop: number): Promise<string[]> {
      const result = await getSharedRedisClient().send("LRANGE", [
        key,
        String(start),
        String(stop),
      ]);
      if (Array.isArray(result)) return result.map(String);
      return [];
    },

    async hSet(key: string, data: Record<string, unknown>): Promise<number> {
      const pairs = flattenHash(data);
      const result = await getSharedRedisClient().send("HSET", [key, ...pairs]);
      return Number(result);
    },

    async hGetAll(key: string): Promise<Record<string, string>> {
      const result = await getSharedRedisClient().send("HGETALL", [key]);
      return arrayToRecord(result);
    },

    async zAdd(
      key: string,
      member: { score: number; value: string },
    ): Promise<number> {
      const result = await getSharedRedisClient().send("ZADD", [
        key,
        String(member.score),
        member.value,
      ]);
      return Number(result);
    },

    async zRange(key: string, start: number, stop: number): Promise<string[]> {
      const result = await getSharedRedisClient().send("ZRANGE", [
        key,
        String(start),
        String(stop),
      ]);
      if (Array.isArray(result)) return result.map(String);
      return [];
    },

    async zRem(key: string, member: string): Promise<number> {
      const result = await getSharedRedisClient().send("ZREM", [key, member]);
      return Number(result);
    },

    async expire(key: string, seconds: number): Promise<boolean> {
      const result = await getSharedRedisClient().expire(key, seconds);
      return Boolean(result);
    },

    async keys(pattern: string): Promise<string[]> {
      const result = await getSharedRedisClient().send("KEYS", [pattern]);
      if (Array.isArray(result)) return result.map(String);
      return [];
    },

    async del(key: string): Promise<number> {
      const result = await getSharedRedisClient().del(key);
      return Number(result);
    },
  };
}
