import { createLoggerWithContext } from "@midday/logger";
import { getSharedRedisClient } from "./shared-redis";

const logger = createLoggerWithContext("redis-cache");

// Every Redis command is raced against this timeout.
// If the socket is half-open (appears connected but server is gone),
// this prevents the API request from hanging forever.
const COMMAND_TIMEOUT_MS = 3_000;

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
    if (!this.isConnected) return undefined;

    try {
      const value = await withTimeout(this.redis.get(this.getKey(key)), "GET");
      return this.parseValue<T>(value);
    } catch (error) {
      logger.error(
        `Get error for ${this.prefix}: ${error instanceof Error ? error.message : error}`,
      );
      return undefined;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected) return;

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
    } catch (error) {
      logger.error(
        `Set error for ${this.prefix}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isConnected) return;

    try {
      await withTimeout(this.redis.del(this.getKey(key)), "DEL");
    } catch (error) {
      logger.error(
        `Delete error for ${this.prefix}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  async healthCheck(): Promise<void> {
    await withTimeout(this.redis.send("PING", []), "PING");
  }
}
