import {
  getApiKeyByToken,
  updateApiKeyLastUsedAt,
} from "@api/db/queries/api-keys";
import { validateAccessToken } from "@api/db/queries/oauth-flow";
import { getUserById } from "@api/db/queries/users";
import { isValidApiKeyFormat } from "@api/utils/api-keys";
import { apiKeyCache } from "@api/utils/cache/api-key-cache";
import { userCache } from "@api/utils/cache/user-cache";
import { expandScopes } from "@api/utils/scopes";
import { hash } from "@midday/encryption";
import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

export const withAuth: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    throw new HTTPException(401, { message: "Authorization header required" });
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer") {
    throw new HTTPException(401, { message: "Invalid authorization scheme" });
  }

  if (!token) {
    throw new HTTPException(401, { message: "Token required" });
  }

  const db = c.get("db");

  // Handle OAuth access tokens (start with mid_access_token_)
  if (token.startsWith("mid_access_token_")) {
    const tokenData = await validateAccessToken(db, token);

    if (!tokenData || !tokenData.user) {
      throw new HTTPException(401, {
        message: "Invalid or expired access token",
      });
    }

    const session = {
      teamId: tokenData.teamId,
      user: {
        id: tokenData.user.id,
        email: tokenData.user.email,
        full_name: tokenData.user.fullName,
      },
      oauth: {
        applicationId: tokenData.applicationId,
        clientId: tokenData.application?.clientId,
        applicationName: tokenData.application?.name,
      },
    };

    c.set("session", session);
    c.set("teamId", session.teamId);
    c.set("scopes", expandScopes(tokenData.scopes ?? []));

    await next();
    return;
  }

  // Handle API keys (start with mid_ but not mid_access_token_)
  if (!token.startsWith("mid_") || !isValidApiKeyFormat(token)) {
    throw new HTTPException(401, { message: "Invalid token format" });
  }

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
