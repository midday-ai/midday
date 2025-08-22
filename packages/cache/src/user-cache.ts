import { LRUCache } from "lru-cache";

export const cache = new LRUCache<string, any>({
  max: 5_000, // up to 5k entries (adjust based on memory)
  ttl: 1000 * 60 * 30, // 30 minutes in milliseconds
});

const prefix = "user";

export const userCache = {
  get: (key: string) => cache.get(`${prefix}:${key}`),
  set: (key: string, value: any) => cache.set(`${prefix}:${key}`, value),
  delete: (key: string) => cache.delete(`${prefix}:${key}`),
};
