import { LRUCache } from "lru-cache";

// In-memory cache to check if a user has access to a team
// Note: This cache is per server instance, and we typically run 1 instance per region.
// Otherwise, we would need to share this state with Redis or a similar external store.
const cache = new LRUCache<string, boolean>({
  max: 5_000, // up to 5k entries (adjust based on memory)
  ttl: 1000 * 60 * 30, // 30 minutes in milliseconds
});

export const teamCache = {
  get: (key: string) => cache.get(key),
  set: (key: string, value: boolean) => cache.set(key, value),
  delete: (key: string) => cache.delete(key),
};
