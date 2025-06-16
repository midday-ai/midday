import type { ApiKey } from "@midday/db/queries";
import { LRUCache } from "lru-cache";

// In-memory cache for API keys and users
// Note: This cache is per server instance, and we typically run 1 instance per region.
// Otherwise, we would need to share this state with Redis or a similar external store.
const cache = new LRUCache<string, any>({
  max: 5_000, // up to 5k entries (adjust based on memory)
  ttl: 1000 * 60 * 30, // 30 minutes in milliseconds
});

const prefix = "api-key";

export const apiKeyCache = {
  get: (key: string): ApiKey | undefined => cache.get(`${prefix}:${key}`),
  set: (key: string, value: ApiKey) => cache.set(`${prefix}:${key}`, value),
  delete: (key: string) => cache.delete(`${prefix}:${key}`),
};
