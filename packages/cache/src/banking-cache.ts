import { RedisCache } from "./redis-client";

// Redis-based cache for banking provider data (tokens, institutions, etc.)
const cache = new RedisCache("banking", 30 * 60); // 30 minutes default TTL

export const bankingCache = {
  get: (key: string): Promise<any | undefined> => cache.get(key),
  set: (key: string, value: any, ttl?: number): Promise<void> =>
    cache.set(key, value, ttl),
  delete: (key: string): Promise<void> => cache.delete(key),
};
