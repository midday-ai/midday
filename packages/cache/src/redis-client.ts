import { createLoggerWithContext } from "@midday/logger";
import { getSharedRedisClient } from "./shared-redis";

const logger = createLoggerWithContext("redis-cache");

// Maximum time (ms) to wait for any single Redis operation.
// If the command hasn't resolved by then, we abandon it and
// return the safe fallback (undefined for reads, void for writes).
const OPERATION_TIMEOUT_MS = 3_000;

/**
 * Race a promise against a timeout. Rejects with a descriptive error
 * if the operation takes longer than `ms` milliseconds.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Redis operation timed out after ${ms}ms`)),
      ms,
    );

    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export class RedisCache {
  private prefix: string;
  private defaultTTL: number;

  constructor(prefix: string, defaultTTL: number = 30 * 60) {
    this.prefix = prefix;
    this.defaultTTL = defaultTTL;
  }

  // Get client lazily - allows picking up reconnected clients
  private get redis() {
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
    const client = this.redis;
    if (!client) {
      return undefined;
    }

    try {
      const value = await withTimeout<string | null>(
        client.get(this.getKey(key)),
        OPERATION_TIMEOUT_MS,
      );
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
    const client = this.redis;
    if (!client) {
      return;
    }

    try {
      const serializedValue = this.stringifyValue(value);
      const redisKey = this.getKey(key);
      const ttl = ttlSeconds ?? this.defaultTTL;

      if (ttl > 0) {
        await withTimeout(
          client.send("SETEX", [redisKey, ttl.toString(), serializedValue]),
          OPERATION_TIMEOUT_MS,
        );
      } else {
        await withTimeout(
          client.set(redisKey, serializedValue),
          OPERATION_TIMEOUT_MS,
        );
      }
    } catch (error) {
      logger.error(`Set error for ${this.prefix} cache`, {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async delete(key: string): Promise<void> {
    const client = this.redis;
    if (!client) {
      return;
    }

    try {
      await withTimeout(client.del(this.getKey(key)), OPERATION_TIMEOUT_MS);
    } catch (error) {
      logger.error(`Delete error for ${this.prefix} cache`, {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async healthCheck(): Promise<void> {
    try {
      await withTimeout(this.redis.send("PING", []), OPERATION_TIMEOUT_MS);
    } catch (error) {
      throw new Error(`Redis health check failed: ${error}`);
    }
  }
}
