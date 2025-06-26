import { expandScopes } from "@api/utils/scopes";
import { isValidApiKeyFormat } from "@db/utils/api-keys";
import { apiKeyCache } from "@midday/cache/api-key-cache";
import { userCache } from "@midday/cache/user-cache";
import {
  getApiKeyByToken,
  getUserById,
  updateApiKeyLastUsedAt,
} from "@midday/db/queries";
import { hash } from "@midday/encryption";
import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

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

  const keyHash = hash(token);

  // Check cache first for API key
  let apiKey = apiKeyCache.get(keyHash);

  if (!apiKey) {
    // If not in cache, query database
    apiKey = await getApiKeyByToken(db, keyHash);
    if (apiKey) {
      // Store in cache for future requests
      apiKeyCache.set(keyHash, apiKey);
    }
  }

  if (!apiKey) {
    throw new HTTPException(401, { message: "Invalid API key" });
  }

  // Check cache first for user
  let user = userCache.get(apiKey.userId);

  if (!user) {
    // If not in cache, query database
    user = await getUserById(db, apiKey.userId);
    if (user) {
      // Store in cache for future requests
      userCache.set(apiKey.userId, user);
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
  c.set("scopes", expandScopes(apiKey.scopes ?? []));

  // Update last used at
  updateApiKeyLastUsedAt(db, apiKey.id);

  await next();
};
