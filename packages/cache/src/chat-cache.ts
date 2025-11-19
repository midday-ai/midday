import { RedisCache } from "./redis-client";

// Redis-based cache for chat data shared across all server instances
const userContextCache = new RedisCache("chat:user", 30 * 60); // 30 minutes TTL
const teamContextCache = new RedisCache("chat:team", 5 * 60); // 5 minutes TTL

// Disable caching in development
const isDevelopment = process.env.NODE_ENV === "development";

export interface ChatTeamContext {
  teamId: string;
  hasBankAccounts?: boolean;
}

export interface ChatUserContext {
  userId: string;
  teamId: string;
  teamName?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  baseCurrency?: string | null;
  countryCode?: string | null;
  dateFormat?: string | null;
  locale?: string | null;
  country?: string | null;
  city?: string | null;
  region?: string | null;
  timezone?: string | null;
  fiscalYearStartMonth?: number | null;
  hasBankAccounts?: boolean;
}

export const chatCache = {
  getUserContext: (
    userId: string,
    teamId: string,
  ): Promise<ChatUserContext | undefined> => {
    if (isDevelopment) return Promise.resolve(undefined);
    return userContextCache.get<ChatUserContext>(`${userId}:${teamId}`);
  },

  setUserContext: (
    userId: string,
    teamId: string,
    context: ChatUserContext,
  ): Promise<void> => {
    if (isDevelopment) return Promise.resolve();
    return userContextCache.set(`${userId}:${teamId}`, context);
  },

  invalidateUserContext: (userId: string, teamId: string): Promise<void> => {
    if (isDevelopment) return Promise.resolve();
    return userContextCache.delete(`${userId}:${teamId}`);
  },

  getTeamContext: (teamId: string): Promise<ChatTeamContext | undefined> => {
    if (isDevelopment) return Promise.resolve(undefined);
    return teamContextCache.get<ChatTeamContext>(teamId);
  },

  setTeamContext: (teamId: string, context: ChatTeamContext): Promise<void> => {
    if (isDevelopment) return Promise.resolve();
    return teamContextCache.set(teamId, context);
  },

  invalidateTeamContext: (teamId: string): Promise<void> => {
    if (isDevelopment) return Promise.resolve();
    return teamContextCache.delete(teamId);
  },
};
