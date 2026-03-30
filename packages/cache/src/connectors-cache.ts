import { RedisCache } from "./redis-client";

const cache = new RedisCache("connectors", 86400); // 24h default TTL

export const connectorsCache = {
  get: <T>(key: string): Promise<T | undefined> => cache.get<T>(key),
  set: (key: string, value: unknown, ttl?: number): Promise<void> =>
    cache.set(key, value, ttl),
  delete: (key: string): Promise<void> => cache.delete(key),

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
