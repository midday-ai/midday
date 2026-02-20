import { createLoggerWithContext } from "@midday/logger";
import { getSharedRedisClient, waitForRedisReady } from "./shared-redis";

const logger = createLoggerWithContext("redis-cache");

const COMMAND_TIMEOUT_MS = 1_500;

const SLOW_COMMAND_MS = 50;

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(`Redis ${label} timed out after ${COMMAND_TIMEOUT_MS}ms`),
          ),
        COMMAND_TIMEOUT_MS,
      ),
    ),
  ]);
}

export class RedisCache {
  private prefix: string;
  private defaultTTL: number;
  private inflight = new Map<string, Promise<unknown>>();

  constructor(prefix: string, defaultTTL: number = 30 * 60) {
    this.prefix = prefix;
    this.defaultTTL = defaultTTL;
  }

  private get redis() {
    return getSharedRedisClient();
  }

  private get isConnected(): boolean {
    try {
      return this.redis.connected;
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
    if (!this.isConnected && !(await waitForRedisReady())) {
      logger.warn("GET skipped: not connected", { prefix: this.prefix, key });
      return undefined;
    }

    const fullKey = this.getKey(key);

    const existing = this.inflight.get(fullKey);
    if (existing) {
      return existing as Promise<T | undefined>;
    }

    const promise = this.executeGet<T>(key, fullKey);
    this.inflight.set(fullKey, promise);

    try {
      return await promise;
    } finally {
      this.inflight.delete(fullKey);
    }
  }

  private async executeGet<T>(
    key: string,
    fullKey: string,
  ): Promise<T | undefined> {
    const start = performance.now();
    try {
      const value = await withTimeout(this.redis.get(fullKey), "GET");
      const elapsed = performance.now() - start;

      if (elapsed > SLOW_COMMAND_MS) {
        logger.warn("Slow GET", {
          prefix: this.prefix,
          key,
          latencyMs: Math.round(elapsed),
          hit: value !== null,
        });
      }

      return this.parseValue<T>(value);
    } catch (error) {
      const elapsed = performance.now() - start;
      logger.error("GET failed", {
        prefix: this.prefix,
        key,
        latencyMs: Math.round(elapsed),
        error: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected && !(await waitForRedisReady())) {
      logger.warn("SET skipped: not connected", { prefix: this.prefix, key });
      return;
    }

    const start = performance.now();
    try {
      const serializedValue = this.stringifyValue(value);
      const redisKey = this.getKey(key);
      const ttl = ttlSeconds ?? this.defaultTTL;

      if (ttl > 0) {
        await withTimeout(
          this.redis.send("SETEX", [redisKey, String(ttl), serializedValue]),
          "SETEX",
        );
      } else {
        await withTimeout(this.redis.set(redisKey, serializedValue), "SET");
      }

      const elapsed = performance.now() - start;
      if (elapsed > SLOW_COMMAND_MS) {
        logger.warn("Slow SET", {
          prefix: this.prefix,
          key,
          latencyMs: Math.round(elapsed),
          ttl,
        });
      }
    } catch (error) {
      const elapsed = performance.now() - start;
      logger.error("SET failed", {
        prefix: this.prefix,
        key,
        latencyMs: Math.round(elapsed),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isConnected && !(await waitForRedisReady())) {
      logger.warn("DEL skipped: not connected", { prefix: this.prefix, key });
      return;
    }

    const start = performance.now();
    try {
      await withTimeout(this.redis.del(this.getKey(key)), "DEL");

      const elapsed = performance.now() - start;
      if (elapsed > SLOW_COMMAND_MS) {
        logger.warn("Slow DEL", {
          prefix: this.prefix,
          key,
          latencyMs: Math.round(elapsed),
        });
      }
    } catch (error) {
      const elapsed = performance.now() - start;
      logger.error("DEL failed", {
        prefix: this.prefix,
        key,
        latencyMs: Math.round(elapsed),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async healthCheck(): Promise<void> {
    const start = performance.now();
    try {
      await withTimeout(this.redis.send("PING", []), "PING");
      const elapsed = performance.now() - start;
      logger.info("Health check OK", { latencyMs: Math.round(elapsed) });
    } catch (error) {
      const elapsed = performance.now() - start;
      logger.error("Health check failed", {
        latencyMs: Math.round(elapsed),
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
