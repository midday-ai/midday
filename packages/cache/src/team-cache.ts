import { RedisCache } from "./redis-client";

// Redis-based cache to check if a user has access to a team, shared across all server instances
const cache = new RedisCache("team", 30 * 60); // 30 minutes TTL

export const teamCache = {
  get: (key: string): Promise<boolean | undefined> => cache.get<boolean>(key),
  set: (key: string, value: boolean): Promise<void> => cache.set(key, value),
  delete: (key: string): Promise<void> => cache.delete(key),
};
