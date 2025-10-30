import { RedisCache } from "./redis-client";

// Redis-based cache for chat data shared across all server instances
const userContextCache = new RedisCache("chat:user", 30 * 60); // 30 minutes TTL
const rateLimitCache = new RedisCache("chat:ratelimit", 60); // 1 minute TTL

export interface ChatUserContext {
  userId: string;
  teamId: string;
  teamName?: string | null;
  fullName?: string | null;
  baseCurrency?: string | null;
  countryCode?: string | null;
}

export const chatCache = {
  // User context caching
  getUserContext: (userId: string): Promise<ChatUserContext | undefined> =>
    userContextCache.get<ChatUserContext>(userId),

  setUserContext: (userId: string, context: ChatUserContext): Promise<void> =>
    userContextCache.set(userId, context),

  // Rate limiting
  getRateLimitCount: (userId: string): Promise<number | undefined> =>
    rateLimitCache.get<number>(`limit:${userId}`),

  incrementRateLimit: async (userId: string): Promise<number> => {
    const current = (await chatCache.getRateLimitCount(userId)) || 0;
    const newCount = current + 1;
    await rateLimitCache.set(`limit:${userId}`, newCount);
    return newCount;
  },
};
