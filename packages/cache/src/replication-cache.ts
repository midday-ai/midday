import { RedisCache } from "./redis-client";

// Redis-based cache to track teams who recently performed mutations, shared across all server instances
// Key: teamId, Value: timestamp when they should be able to use replicas again
const REPLICATION_LAG_WINDOW = 10000; // 10 seconds in milliseconds
const cache = new RedisCache("replication", 10); // 10 seconds TTL

export const replicationCache = {
  get: (key: string): Promise<number | undefined> => cache.get<number>(key),

  set: async (key: string): Promise<void> => {
    // Set the timestamp when the team can use replicas again
    const expiryTime = Date.now() + REPLICATION_LAG_WINDOW;
    await cache.set(key, expiryTime);
  },

  delete: (key: string): Promise<void> => cache.delete(key),
};
