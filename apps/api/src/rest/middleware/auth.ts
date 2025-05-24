import { getApiKeyByKey } from "@api/db/queries/api-keys";
import { getUserById } from "@api/db/queries/users";
import { isValidApiKeyFormat } from "@api/utils/api-keys";
import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { LRUCache } from "lru-cache";

// In-memory cache for API keys and users
// Note: This cache is per server instance, and we typically run 1 instance per region.
// Otherwise, we would need to share this state with Redis or a similar external store.
const apiKeyCache = new LRUCache<string, any>({
  max: 5_000, // up to 5k entries (adjust based on memory)
  ttl: 1000 * 60 * 30, // 30 minutes in milliseconds
});

const userCache = new LRUCache<string, any>({
  max: 5_000, // up to 5k entries (adjust based on memory)
  ttl: 1000 * 60 * 30, // 30 minutes in milliseconds
});

export const withAuth: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.split(" ")[1];

  if (token && !isValidApiKeyFormat(token)) {
    throw new HTTPException(401, { message: "Invalid API key format" });
  }

  if (!token) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const db = c.get("db");

  // Check cache first for API key
  let apiKey = apiKeyCache.get(token);
  if (!apiKey) {
    // If not in cache, query database
    apiKey = await getApiKeyByKey(db, token);
    if (apiKey) {
      // Store in cache for future requests
      apiKeyCache.set(token, apiKey);
    }
  }

  if (!apiKey) {
    throw new HTTPException(401, { message: "Invalid API key" });
  }

  // Check cache first for user
  const userCacheKey = `user_${apiKey.userId}`;
  let user = userCache.get(userCacheKey);
  if (!user) {
    // If not in cache, query database
    user = await getUserById(db, apiKey.userId);
    if (user) {
      // Store in cache for future requests
      userCache.set(userCacheKey, user);
    }
  }

  if (!user) {
    throw new HTTPException(401, { message: "User not found" });
  }

  const session = {
    teamId: apiKey.teamId,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
    },
  };

  c.set("session", session);
  c.set("teamId", session.teamId);

  await next();
};
