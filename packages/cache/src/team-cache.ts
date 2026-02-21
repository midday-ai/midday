import { RedisCache } from "./redis-client";
import { teamPermissionsCache } from "./team-permissions-cache";

// Redis-based cache to check if a user has access to a team, shared across all server instances
const cache = new RedisCache("team", 30 * 60); // 30 minutes TTL

export const teamCache = {
  get: (key: string): Promise<boolean | undefined> => cache.get<boolean>(key),
  set: (key: string, value: boolean): Promise<void> => cache.set(key, value),
  delete: (key: string): Promise<void> => cache.delete(key),

  /**
   * Invalidate all team-related cache entries for a user.
   * Call this whenever team membership or active team changes.
   * Clears: per-team access cache and REST permissions cache.
   */
  invalidateForUser: (
    userId: string,
    teamId?: string | null,
  ): Promise<void> => {
    const deletes: Promise<void>[] = [
      teamPermissionsCache.delete(`user:${userId}:team`),
    ];

    if (teamId) {
      deletes.push(cache.delete(`user:${userId}:team:${teamId}`));
    }

    return Promise.all(deletes).then(() => undefined);
  },
};
