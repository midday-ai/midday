import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { APIKeyRepository } from "../data/apiKeyRepository";
import { UserRepository } from "../data/userRepository";
import { User } from "../db/schema";

/** Paths that are publicly accessible without authentication */
const PUBLIC_PATHS = ["/", "/openapi", "/health"];

/**
 * Authentication middleware
 *
 * @description Handles authentication for protected routes using API key and UserId
 * @param {Context} c - The Hono context object
 * @param {Next} next - The next middleware function
 * @returns {Promise<Response | void>} The response or void if passing to next middleware
 * @throws {HTTPException} Throws a 401 error if authentication fails
 */
export const authMiddleware = async (c: Context, next: Next) => {
  if (PUBLIC_PATHS.includes(c.req.path)) {
    return next();
  }

  const apiKey = c.req.header("X-API-Key");
  const userId = c.req.header("X-User-Id");

  if (!apiKey || !userId) {
    throw new HTTPException(401, { message: "Missing authentication headers" });
  }

  const { db } = c.get('services');
  const apiKeyRepo = new APIKeyRepository(db);
  const userRepo = new UserRepository(db);

  // Check cache first
  const cachedUser = await c.env.KV.get(`auth:${apiKey}:${userId}`);
  if (cachedUser) {
    c.set('user', JSON.parse(cachedUser) as User);
    return next();
  }

  // Validate API key and user
  const isValidApiKey = await apiKeyRepo.isValidApiKey(apiKey);
  if (!isValidApiKey) {
    throw new HTTPException(401, { message: "Invalid API key" });
  }

  const user = await userRepo.getById(userId);
  if (!user) {
    throw new HTTPException(401, { message: "Invalid or inactive user" });
  }

  // Cache the authenticated user
  await c.env.KV.put(`auth:${apiKey}:${userId}`, JSON.stringify(user), { expirationTtl: 3600 });

  // Set the authenticated user in the context
  c.set('user', user);

  // TODO: Implement rate limiting based on the API key

  // Log the successful authentication
  console.log(`User ${userId} authenticated successfully`);

  return next();
};