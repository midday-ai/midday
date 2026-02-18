import { RedisCache } from "./redis-client";

// Shared TTL constants for banking provider caching
export const CacheTTL = {
  FIFTEEN_MINUTES: 900,
  THIRTY_MINUTES: 1800,
  ONE_HOUR: 3600,
  TWENTY_FOUR_HOURS: 86400,
} as const;

// Redis-based cache for banking provider data (tokens, institutions, etc.)
const cache = new RedisCache("banking", 30 * 60); // 30 minutes default TTL

export const bankingCache = {
  get: (key: string): Promise<any | undefined> => cache.get(key),
  set: (key: string, value: any, ttl?: number): Promise<void> =>
    cache.set(key, value, ttl),
  delete: (key: string): Promise<void> => cache.delete(key),

  /**
   * Get a cached value or compute and store it.
   * Eliminates the repeated check-cache / fetch / store pattern.
   */
  getOrSet: async <T>(
    key: string,
    ttl: number,
    fn: () => Promise<T>,
  ): Promise<T> => {
    const cached = await cache.get<T>(key);
    if (cached !== undefined) return cached;
    const result = await fn();
    await cache.set(key, result, ttl);
    return result;
  },
};
