import { LRUCache } from "lru-cache";

const teamPermissionCache = new LRUCache<string, string>({
  max: 5_000, // up to 5k entries
  ttl: 1000 * 60 * 30, // 30 minutes in milliseconds
});

const prefix = "team-permissions";

export const teamPermissionsCache = {
  get: (key: string) => teamPermissionCache.get(`${prefix}:${key}`),
  set: (key: string, value: string) =>
    teamPermissionCache.set(`${prefix}:${key}`, value),
  delete: (key: string) => teamPermissionCache.delete(`${prefix}:${key}`),
};
