import { getSharedRedisClient } from "./shared-redis";

export class RedisCache {
  private prefix: string;
  private defaultTTL: number;

  constructor(prefix: string, defaultTTL: number = 30 * 60) {
    this.prefix = prefix;
    this.defaultTTL = defaultTTL;
  }

  private getRedisClient() {
    return getSharedRedisClient();
  }

  private parseValue<T>(value: string | null): T | undefined {
    if (!value) return undefined;

    try {
      return JSON.parse(value) as T;
    } catch {
      // If parsing fails, return the raw string (for backwards compatibility)
      return value as unknown as T;
    }
  }

  private stringifyValue(value: any): string {
    if (typeof value === "string") {
      return value;
    }

    return JSON.stringify(value);
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const redis = this.getRedisClient();
      const value = await redis.get(this.getKey(key));
      return this.parseValue<T>(value);
    } catch (error) {
      console.error(
        `Redis get error for ${this.prefix} cache, key "${key}":`,
        error,
      );
      return undefined;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const redis = this.getRedisClient();
      const serializedValue = this.stringifyValue(value);
      const redisKey = this.getKey(key);
      const ttl = ttlSeconds ?? this.defaultTTL;

      if (ttl > 0) {
        // Use setEx for atomic set + expire (single round trip)
        await redis.setEx(redisKey, ttl, serializedValue);
      } else {
        await redis.set(redisKey, serializedValue);
      }
    } catch (error) {
      console.error(
        `Redis set error for ${this.prefix} cache, key "${key}":`,
        error,
      );
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const redis = this.getRedisClient();
      await redis.del(this.getKey(key));
    } catch (error) {
      console.error(
        `Redis delete error for ${this.prefix} cache, key "${key}":`,
        error,
      );
    }
  }

  async healthCheck(): Promise<void> {
    try {
      const redis = this.getRedisClient();
      await redis.ping();
    } catch (error) {
      throw new Error(`Redis health check failed: ${error}`);
    }
  }
}
