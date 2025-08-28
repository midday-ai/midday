import { RedisClient } from "bun";

export class RedisCache {
  private redis: RedisClient | null = null;
  private prefix: string;
  private defaultTTL: number;

  constructor(prefix: string, defaultTTL: number = 30 * 60) {
    this.prefix = prefix;
    this.defaultTTL = defaultTTL;
  }

  private getRedisClient(): RedisClient {
    if (!this.redis) {
      const redisUrl = process.env.REDIS_URL;

      if (!redisUrl) {
        throw new Error("REDIS_URL environment variable is required");
      }

      // Configure connection options for Fly.io production vs local development
      const isProduction =
        process.env.NODE_ENV === "production" || process.env.FLY_APP_NAME;

      const options = isProduction
        ? {
            // Fly.io production settings - handles IPv6 connections
            connectionTimeout: 10000,
            idleTimeout: 30000,
            autoReconnect: true,
            maxRetries: 10,
            enableOfflineQueue: true,
            enableAutoPipelining: true,
            // Enable TLS for production Upstash connections
            tls: redisUrl.startsWith("rediss://"),
          }
        : {
            // Local development settings - IPv4 connections
            connectionTimeout: 5000,
            idleTimeout: 0, // No idle timeout for dev
            autoReconnect: true,
            maxRetries: 3,
            enableOfflineQueue: true,
            enableAutoPipelining: true,
            tls: redisUrl.startsWith("rediss://"),
          };

      this.redis = new RedisClient(redisUrl, options);
    }

    return this.redis;
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

      await redis.set(redisKey, serializedValue);
      if (ttl > 0) {
        await redis.expire(redisKey, ttl);
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
}
