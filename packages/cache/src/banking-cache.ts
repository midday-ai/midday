import { RedisCache } from "./redis-client";

// Cache TTL constants for banking operations
export const BANKING_CACHE_TTL = {
  ACCESS_TOKEN: 3600, // 1 hour
  REFRESH_TOKEN: 86400, // 24 hours
  INSTITUTIONS: 86400, // 24 hours (rarely changes)
  RATES: 3600, // 1 hour
  BALANCE: 300, // 5 minutes (for dashboard display)
  CONNECTION_STATUS: 60, // 1 minute
} as const;

// Redis-based cache for banking provider data
const cache = new RedisCache("banking", BANKING_CACHE_TTL.INSTITUTIONS);

export const bankingCache = {
  /**
   * Get cached value by provider and type
   */
  get: <T>(provider: string, type: string): Promise<T | undefined> =>
    cache.get<T>(`${provider}:${type}`),

  /**
   * Set cached value with specific TTL
   */
  set: (
    provider: string,
    type: string,
    value: unknown,
    ttlSeconds: number,
  ): Promise<void> => cache.set(`${provider}:${type}`, value, ttlSeconds),

  /**
   * Delete cached value
   */
  delete: (provider: string, type: string): Promise<void> =>
    cache.delete(`${provider}:${type}`),

  /**
   * Get with a keyed suffix (e.g., for per-country institution caching)
   */
  getKeyed: <T>(
    provider: string,
    type: string,
    key: string,
  ): Promise<T | undefined> => cache.get<T>(`${provider}:${type}:${key}`),

  /**
   * Set with a keyed suffix (e.g., for per-country institution caching)
   */
  setKeyed: (
    provider: string,
    type: string,
    key: string,
    value: unknown,
    ttlSeconds: number,
  ): Promise<void> => cache.set(`${provider}:${type}:${key}`, value, ttlSeconds),
};
