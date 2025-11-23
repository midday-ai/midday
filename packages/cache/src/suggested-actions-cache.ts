import { RedisCache } from "./redis-client";

// Redis-based cache for tracking suggested action usage per team + user
const cache = new RedisCache("suggested-actions", 7 * 24 * 60 * 60); // 7 days TTL

export interface SuggestedActionUsage {
  actionId: string;
  count: number;
  lastUsed: Date;
}

export const suggestedActionsCache = {
  // Get usage stats for a specific action
  getUsage: async (
    teamId: string,
    userId: string,
    actionId: string,
  ): Promise<SuggestedActionUsage | undefined> => {
    const key = `${teamId}:${userId}:${actionId}`;
    return cache.get<SuggestedActionUsage>(key);
  },

  // Get all usage stats for a user in a team
  getAllUsage: async (
    teamId: string,
    userId: string,
  ): Promise<Record<string, SuggestedActionUsage>> => {
    // Note: Redis doesn't support pattern matching efficiently
    // We'll store a summary object as well for efficient retrieval
    const summaryKey = `${teamId}:${userId}:summary`;
    const summary =
      await cache.get<Record<string, SuggestedActionUsage>>(summaryKey);
    return summary || {};
  },

  // Increment usage for a specific action
  incrementUsage: async (
    teamId: string,
    userId: string,
    actionId: string,
  ): Promise<void> => {
    const key = `${teamId}:${userId}:${actionId}`;
    const summaryKey = `${teamId}:${userId}:summary`;

    // Get current usage
    const currentUsage = (await cache.get<SuggestedActionUsage>(key)) || {
      actionId,
      count: 0,
      lastUsed: new Date(),
    };

    // Update usage
    const updatedUsage: SuggestedActionUsage = {
      ...currentUsage,
      count: currentUsage.count + 1,
      lastUsed: new Date(),
    };

    // Update individual action cache
    await cache.set(key, updatedUsage);

    // Update summary cache
    const currentSummary =
      (await cache.get<Record<string, SuggestedActionUsage>>(summaryKey)) || {};
    currentSummary[actionId] = updatedUsage;
    await cache.set(summaryKey, currentSummary);
  },

  // Clear usage for a specific action
  clearUsage: async (
    teamId: string,
    userId: string,
    actionId: string,
  ): Promise<void> => {
    const key = `${teamId}:${userId}:${actionId}`;
    const summaryKey = `${teamId}:${userId}:summary`;

    await cache.delete(key);

    // Update summary
    const currentSummary =
      (await cache.get<Record<string, SuggestedActionUsage>>(summaryKey)) || {};
    delete currentSummary[actionId];
    await cache.set(summaryKey, currentSummary);
  },

  // Clear all usage for a user in a team
  clearAllUsage: async (teamId: string, userId: string): Promise<void> => {
    const summaryKey = `${teamId}:${userId}:summary`;
    const summary =
      (await cache.get<Record<string, SuggestedActionUsage>>(summaryKey)) || {};

    // Delete all individual action caches
    for (const actionId of Object.keys(summary)) {
      const key = `${teamId}:${userId}:${actionId}`;
      await cache.delete(key);
    }

    // Delete summary
    await cache.delete(summaryKey);
  },
};
