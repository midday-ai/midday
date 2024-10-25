import { Context, Next } from "hono";
import { cache } from "hono/cache";
import { HTTPException } from "hono/http-exception";
import { a } from "vitest/dist/suite-ynYMzeLu.js";
import constants from "../constants/constant";
import { APIKeyRepository } from "../db-repository/api-key-repository";
import { UserRepository } from "../db-repository/user-repository";
import { User } from "../db/schema";

/**
 * Authentication middleware
 *
 * @description Handles authentication for protected routes using API key and UserId
 * @param {Context} c - The Hono context object
 * @param {Next} next - The next middleware function
 * @returns {Promise<Response | void>} The response or void if passing to next middleware
 * @throws {HTTPException} Throws a 401 error if authentication fails
 */
export const authMiddleware = async (
  c: Context,
  next: Next,
): Promise<Response | void> => {
  if (constants.PUBLIC_PATHS.includes(c.req.path)) {
    return next();
  }

  const apiKey = c.req.header("X-API-Key");
  const userIdStr = c.req.header("X-User-Id");
  const userId = userIdStr ? parseInt(userIdStr, 10) : null;

  if (!apiKey || !userId || isNaN(userId)) {
    throw new HTTPException(401, {
      message: "Missing or invalid authentication headers",
    });
  }

  const { db } = c.get("ctx");
  const apiKeyRepo = new APIKeyRepository(db);
  const userRepo = new UserRepository(db);

  try {
    // Check cache first
    const cachedUser = await getCachedUser(c, apiKey, userId);
    const cachedApiKey = await getCacheApiKey(c, apiKey)

    if (cachedUser && cachedApiKey) {
      c.set("user", cachedUser);
      c.set("apiKey", cachedApiKey);
      return next();
    }

    // Validate API key and user
    const [isValidApiKey, user] = await Promise.all([
      apiKeyRepo.isValidApiKey(apiKey),
      userRepo.getById(userId),
    ]);

    if (!isValidApiKey) {
      throw new HTTPException(401, { message: "Missing or invalid authentication headers" });
    }

    if (!user) {
      throw new HTTPException(401, { message: "Invalid or inactive user" });
    }

    // Cache the authenticated user
    await cacheUser(c, apiKey, userId, user);

    await cacheApiKey(c, apiKey);

    // Set the authenticated user in the context
    c.set("user", user);

    // Log the successful authentication
    c.get("ctx").logger.info(`User ${userId} authenticated successfully`);
    return next();
  } catch (error) {
    handleAuthError(c, error);
  }
};

async function getCachedUser(
  c: Context,
  apiKey: string,
  userId: number,
): Promise<User | null> {
  const cachedUser = await c.env.KV.get(getUserApiKeyCacheKeyReference(apiKey, userId));
  return cachedUser ? JSON.parse(cachedUser) : null;
}

async function getCacheApiKey(
  c: Context,
  apiKey: string,
): Promise<string | null> {
  const cachedApiKey = await c.env.KV.get(getApiKeyCacheKeyReference(apiKey));
  return cachedApiKey ? cachedApiKey : null;
}

async function cacheUser(
  c: Context,
  apiKey: string,
  userId: number,
  user: User,
): Promise<void> {
  await c.env.KV.put(`auth:${apiKey}:${userId}`, JSON.stringify(user), {
    expirationTtl: constants.CACHE_TTL,
  });
}

async function cacheApiKey(
  c: Context,
  apiKey: string,
): Promise<void> {
  await c.env.KV.put(getApiKeyCacheKeyReference(apiKey), apiKey.toString(), {
    expirationTtl: constants.CACHE_TTL,
  });
}

function handleAuthError(c: Context, error: unknown): never {
  if (error instanceof HTTPException) {
    throw error;
  }
  c.get("logger").error("Authentication error:", error);
  throw new HTTPException(500, {
    message: "Internal server error during authentication",
  });
}

export const getUserApiKeyCacheKeyReference = (apiKey: string, userId: number): string =>
  `auth:${apiKey}:${userId}`;

export const getApiKeyCacheKeyReference = (apiKey: string): string => `auth:${apiKey}:api_keys`;