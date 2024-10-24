import { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { APIKeyRepository } from "../db-repository/api-key-repository";
import { UserRepository } from "../db-repository/user-repository";
import { User } from "../db/schema";
import constants from "../constants/constant";

/**
 * Authentication middleware
 *
 * @description Handles authentication for protected routes using API key and UserId
 * @param {Context} c - The Hono context object
 * @param {Next} next - The next middleware function
 * @returns {Promise<Response | void>} The response or void if passing to next middleware
 * @throws {HTTPException} Throws a 401 error if authentication fails
 */
export const authMiddleware = async (c: Context, next: Next): Promise<Response | void> => {
  if (constants.PUBLIC_PATHS.includes(c.req.path)) {
    return next();
  }

  const apiKey = c.req.header("X-API-Key");
  const userIdStr = c.req.header("X-User-Id");
  const userId = userIdStr ? parseInt(userIdStr, 10) : null;

  if (!apiKey || !userId || isNaN(userId)) {
    throw new HTTPException(401, { message: "Missing or invalid authentication headers" });
  }

  const { db } = c.get('services');
  const apiKeyRepo = new APIKeyRepository(db);
  const userRepo = new UserRepository(db);

  try {
    // Check cache first
    const cachedUser = await getCachedUser(c, apiKey, userId);
    if (cachedUser) {
      c.set('user', cachedUser);
      return next();
    }

    // Validate API key and user
    await validateApiKeyAndUser(apiKeyRepo, userRepo, apiKey, userId);

    const user = await userRepo.getById(userId);
    if (!user) {
      throw new HTTPException(401, { message: "Invalid or inactive user" });
    }

    // Cache the authenticated user
    await cacheUser(c, apiKey, userId, user);

    // Set the authenticated user in the context
    c.set('user', user);

    // Log the successful authentication
    c.get('logger').info(`User ${userId} authenticated successfully`);

    return next();
  } catch (error) {
    handleAuthError(c, error);
  }
};

async function getCachedUser(c: Context, apiKey: string, userId: number): Promise<User | null> {
  const cachedUser = await c.env.KV.get(`auth:${apiKey}:${userId}`);
  return cachedUser ? JSON.parse(cachedUser) : null;
}

async function validateApiKeyAndUser(
  apiKeyRepo: APIKeyRepository,
  userRepo: UserRepository,
  apiKey: string,
  userId: number
): Promise<void> {
  const [isValidApiKey, user] = await Promise.all([
    apiKeyRepo.isValidApiKey(apiKey),
    userRepo.getById(userId)
  ]);

  if (!isValidApiKey) {
    throw new HTTPException(401, { message: "Invalid API key" });
  }

  if (!user) {
    throw new HTTPException(401, { message: "Invalid or inactive user" });
  }
}

async function cacheUser(c: Context, apiKey: string, userId: number, user: User): Promise<void> {
  await c.env.KV.put(`auth:${apiKey}:${userId}`, JSON.stringify(user), { expirationTtl: constants.CACHE_TTL });
}


function handleAuthError(c: Context, error: unknown): never {
  if (error instanceof HTTPException) {
    throw error;
  }
  c.get('logger').error('Authentication error:', error);
  throw new HTTPException(500, { message: "Internal server error during authentication" });
}