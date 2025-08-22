import { LRUCache } from "lru-cache";

// In-memory map to track teams who recently performed mutations.
// Note: This map is per server instance, and we typically run 1 instance per region.
// Otherwise, we would need to share this state with Redis or a similar external store.
// Key: teamId, Value: timestamp when they should be able to use replicas again
const cache = new LRUCache<string, number>({
  max: 5_000, // up to 5k entries
  ttl: 10000, // 10 seconds in milliseconds
});

// The window time in milliseconds to handle replication lag (10 seconds)
const REPLICATION_LAG_WINDOW = 10000;

const prefix = "replication";

export const replicationCache = {
  get: (key: string) => cache.get(`${prefix}:${key}`),
  set: (key: string) => {
    // Set the timestamp when the team can use replicas again
    const expiryTime = Date.now() + REPLICATION_LAG_WINDOW;

    cache.set(`${prefix}:${key}`, expiryTime);
  },
  delete: (key: string) => cache.delete(`${prefix}:${key}`),
};
