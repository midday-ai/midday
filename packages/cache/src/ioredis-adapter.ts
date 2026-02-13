import { getSharedRedisClient } from "./shared-redis";

/**
 * Adapter that wraps Bun's native RedisClient to match the ioredis interface
 * expected by @ai-sdk-tools/memory's RedisProvider.
 *
 * Bun's RedisClient uses lowercase method names (like ioredis) so RedisProvider
 * treats it as ioredis, but the `zadd` signature differs:
 *   - ioredis (what RedisProvider calls): zadd(key, { score, member })
 *   - Bun:                                zadd(key, score, member)
 *
 * This adapter translates the object-based zadd calls to Bun's flat args,
 * and normalizes hgetall to return null instead of {} for missing keys.
 */
class IORedisAdapter {
  private get redis() {
    return getSharedRedisClient();
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    return this.redis.setex(key, seconds, value);
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    return this.redis.rpush(key, ...values);
  }

  async ltrim(key: string, start: number, stop: number): Promise<string> {
    return this.redis.ltrim(key, start, stop);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.redis.expire(key, seconds);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.redis.lrange(key, start, stop);
  }

  async hset(key: string, data: Record<string, unknown>): Promise<number> {
    return this.redis.hset(key, data);
  }

  async hgetall(key: string): Promise<Record<string, string> | null> {
    const result = await this.redis.hgetall(key);
    // Bun returns {} for missing keys; ioredis returns null
    if (!result || Object.keys(result).length === 0) {
      return null;
    }
    return result;
  }

  async zadd(
    key: string,
    ...args: Array<{ score: number; member: string }>
  ): Promise<number> {
    // RedisProvider calls: zadd(key, { score, member })
    // Bun expects:         zadd(key, score, member, score2, member2, ...)
    const flatArgs: (string | number)[] = [];
    for (const arg of args) {
      flatArgs.push(arg.score, arg.member);
    }
    return this.redis.zadd(key, ...flatArgs);
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.redis.zrange(key, start, stop);
  }

  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.redis.zrevrange(key, start, stop);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.redis.keys(pattern);
  }

  async del(key: string): Promise<number> {
    return this.redis.del(key);
  }

  async zrem(key: string, member: string): Promise<number> {
    return this.redis.zrem(key, member);
  }
}

/**
 * Create an ioredis-compatible adapter around Bun's RedisClient.
 * Use this when passing the Redis client to libraries that expect
 * ioredis (e.g. @ai-sdk-tools/memory RedisProvider).
 */
export function createIORedisAdapter() {
  return new IORedisAdapter();
}
