import { createLoggerWithContext } from "@midday/logger";
import { getSharedRedisClient } from "./shared-redis";

const logger = createLoggerWithContext("redis-cache");

export class RedisCache {
  private prefix: string;
  private defaultTTL: number;

  constructor(prefix: string, defaultTTL: number = 30 * 60) {
    this.prefix = prefix;
    this.defaultTTL = defaultTTL;
  }

  private get redis() {
    return getSharedRedisClient();
  }

  /**
   * Fail-fast guard: when the client is mid-reconnect, skip the operation
   * instead of queuing commands against a dead socket (which is what causes
   * the "slow after inactivity" hang). The app keeps working with a cache
   * miss while node-redis reconnects in the background.
   */
  private get isReady(): boolean {
    try {
      return this.redis.isReady;
    } catch {
      return false;
    }
  }

  private parseValue<T>(value: string | null): T | undefined {
    if (!value) return undefined;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  private stringifyValue(value: unknown): string {
    if (typeof value === "string") {
      return value;
    }
    return JSON.stringify(value);
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async get<T>(key: string): Promise<T | undefined> {
    if (!this.isReady) {
      logger.warn(`Client not ready, skipping get for ${this.prefix}`, {
        key,
      });
      return undefined;
    }

    try {
      const value = await this.redis.get(this.getKey(key));
      return this.parseValue<T>(value);
    } catch (error) {
      logger.error(`Get error for ${this.prefix} cache`, {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!this.isReady) {
      logger.warn(`Client not ready, skipping set for ${this.prefix}`, {
        key,
      });
      return;
    }

    try {
      const serializedValue = this.stringifyValue(value);
      const redisKey = this.getKey(key);
      const ttl = ttlSeconds ?? this.defaultTTL;

      if (ttl > 0) {
        await this.redis.setEx(redisKey, ttl, serializedValue);
      } else {
        await this.redis.set(redisKey, serializedValue);
      }
    } catch (error) {
      logger.error(`Set error for ${this.prefix} cache`, {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isReady) {
      logger.warn(`Client not ready, skipping delete for ${this.prefix}`, {
        key,
      });
      return;
    }

    try {
      await this.redis.del(this.getKey(key));
    } catch (error) {
      logger.error(`Delete error for ${this.prefix} cache`, {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async healthCheck(): Promise<void> {
    try {
      await this.redis.ping();
    } catch (error) {
      throw new Error(`Redis health check failed: ${error}`);
    }
  }
}
