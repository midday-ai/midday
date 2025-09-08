import type { Database } from "@db/client";
import { chatCache } from "@midday/cache/chat-cache";
import type { ChatUserContext } from "@midday/cache/chat-cache";
import { getTeamById, getUserById } from "@midday/db/queries";
import { logger } from "@midday/logger";
import { HTTPException } from "hono/http-exception";

interface GetUserContextParams {
  db: Database;
  userId: string;
  teamId: string;
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
}

/**
 * Gets user context for chat operations, with caching support
 * Fetches team and user data if not cached, then caches the result
 */
export async function getUserContext({
  db,
  userId,
  teamId,
  country,
  city,
  region,
  timezone,
}: GetUserContextParams): Promise<ChatUserContext> {
  // Try to get cached context first
  const cached = await chatCache.getUserContext(userId, teamId);
  if (cached) {
    return cached;
  }

  // If not cached, fetch team and user data in parallel
  const [team, user] = await Promise.all([
    getTeamById(db, teamId),
    getUserById(db, userId),
  ]);

  if (!team || !user) {
    throw new HTTPException(404, {
      message: "User or team not found",
    });
  }

  const context: ChatUserContext = {
    userId,
    teamId,
    teamName: team.name,
    fullName: user.fullName,
    baseCurrency: team.baseCurrency,
    locale: user.locale ?? "en-US",
    dateFormat: user.dateFormat,
    country,
    city,
    region,
    timezone,
  };

  // Cache for future requests (non-blocking)
  chatCache.setUserContext(userId, teamId, context).catch((err) => {
    logger.warn({
      msg: "Failed to cache user context",
      userId,
      teamId,
      error: err.message,
    });
  });

  return context;
}
