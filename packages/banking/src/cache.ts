import { getSharedRedisClient } from "@midday/cache/shared-redis";

const CACHE_PREFIX = "banking";

export class BankingCache {
  #redis = getSharedRedisClient();

  private key(provider: string, type: string): string {
    return `${CACHE_PREFIX}:${provider}:${type}`;
  }

  async get<T>(provider: string, type: string): Promise<T | null> {
    const value = await this.#redis.get(this.key(provider, type));
    return value ? (JSON.parse(value) as T) : null;
  }

  async set<T>(
    provider: string,
    type: string,
    value: T,
    ttlSeconds: number,
  ): Promise<void> {
    await this.#redis.setEx(
      this.key(provider, type),
      ttlSeconds,
      JSON.stringify(value),
    );
  }

  async delete(provider: string, type: string): Promise<void> {
    await this.#redis.del(this.key(provider, type));
  }

  /**
   * Get with a keyed suffix (e.g., for per-country institution caching)
   */
  async getKeyed<T>(
    provider: string,
    type: string,
    key: string,
  ): Promise<T | null> {
    const value = await this.#redis.get(`${this.key(provider, type)}:${key}`);
    return value ? (JSON.parse(value) as T) : null;
  }

  /**
   * Set with a keyed suffix (e.g., for per-country institution caching)
   */
  async setKeyed<T>(
    provider: string,
    type: string,
    key: string,
    value: T,
    ttlSeconds: number,
  ): Promise<void> {
    await this.#redis.setEx(
      `${this.key(provider, type)}:${key}`,
      ttlSeconds,
      JSON.stringify(value),
    );
  }
}

// Singleton instance
export const bankingCache = new BankingCache();

// Cache TTL constants
export const CACHE_TTL = {
  ACCESS_TOKEN: 3600, // 1 hour
  REFRESH_TOKEN: 86400, // 24 hours
  INSTITUTIONS: 3600, // 1 hour
  RATES: 3600, // 1 hour
} as const;
