import { RedisClient } from "bun";

export class RedisCache {
  private redis: RedisClient | null = null;
  private prefix: string;
  private defaultTTL: number;

  constructor(prefix: string, defaultTTL: number = 30 * 60) {
    this.prefix = prefix;
    this.defaultTTL = defaultTTL;
  }

  private async getRedisClient(): Promise<RedisClient> {
    // Always test existing connection if we have one
    if (this.redis) {
      try {
        await this.redis.ping();
        return this.redis;
      } catch (error) {
        console.log(`Redis connection lost, reconnecting... Error: ${error}`);
        try {
          this.redis.close();
        } catch (closeError) {
          // Ignore close errors
        }
        this.redis = null;
      }
    }

    // Create new connection with enhanced options
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      throw new Error("REDIS_URL environment variable is required");
    }

    const isProduction =
      process.env.NODE_ENV === "production" || process.env.FLY_APP_NAME;

    const options = isProduction
      ? {
          // Fly.io production settings - enhanced based on your previous solution
          connectionTimeout: 15000, // Increased for Fly.io
          idleTimeout: 60000, // 1 minute - longer for production stability
          autoReconnect: true,
          maxRetries: 10, // More retries for production
          enableOfflineQueue: true,
          enableAutoPipelining: true,
          tls: redisUrl.startsWith("rediss://"),
        }
      : {
          // Local development settings
          connectionTimeout: 5000,
          idleTimeout: 0,
          autoReconnect: true,
          maxRetries: 3,
          enableOfflineQueue: true,
          enableAutoPipelining: true,
          tls: redisUrl.startsWith("rediss://"),
        };

    this.redis = new RedisClient(redisUrl, options);

    // Log connection creation for debugging
    console.log(`Redis connection created for ${this.prefix} cache`);

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
      const redis = await this.getRedisClient();
      const value = await redis.get(this.getKey(key));
      return this.parseValue<T>(value);
    } catch (error) {
      console.error(
        `Redis get error for ${this.prefix} cache, key "${key}":`,
        error,
      );
      // Reset connection on error to force reconnection next time
      this.redis = null;
      return undefined;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const redis = await this.getRedisClient();
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
      // Reset connection on error
      this.redis = null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const redis = await this.getRedisClient();
      await redis.del(this.getKey(key));
    } catch (error) {
      console.error(
        `Redis delete error for ${this.prefix} cache, key "${key}":`,
        error,
      );
      // Reset connection on error
      this.redis = null;
    }
  }

  async healthCheck(): Promise<void> {
    try {
      const redis = await this.getRedisClient();
      await redis.ping();
    } catch (error) {
      // Reset connection state on health check failure
      this.redis = null;

      throw new Error(`Redis health check failed: ${error}`);
    }
  }
}
