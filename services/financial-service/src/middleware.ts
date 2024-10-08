import type { Context, Next } from "hono";
import { env } from "hono/adapter";
import { bearerAuth } from "hono/bearer-auth";
import { cache } from "hono/cache";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { timing } from "hono/timing";
import { logger as customLogger } from "./utils/logger";

/** Paths that are publicly accessible without authentication */
const PUBLIC_PATHS = ["/", "/openapi", "/health"];

/**
 * Authentication middleware
 * 
 * @description Handles authentication for protected routes using bearer token
 * @param {Context} c - The Hono context object
 * @param {Next} next - The next middleware function
 * @returns {Promise<Response | void>} The response or void if passing to next middleware
 * @throws {HTTPException} Throws a 500 error if API_SECRET_KEY is not set
 */
const authMiddleware = async (c: Context, next: Next) => {
  if (PUBLIC_PATHS.includes(c.req.path)) {
    return next();
  }

  const { API_SECRET_KEY } = env(c);
  if (!API_SECRET_KEY) {
    throw new HTTPException(500, { message: "API_SECRET_KEY is not set" });
  }

  // TODO: Enhance authentication process
  // 1. Extract API key from the Authorization header
  // 2. Call the backend (e.g., database or key-value store) to store valid API keys
  // 3. Query the datastore to verify if the extracted API key exists
  // 4. Check if the API key is associated with an active account
  // 5. If the key is valid and active, allow the request to proceed
  // 6. If the key is invalid or inactive, return a 401 Unauthorized response
  // 7. Consider implementing rate limiting based on the API key
  // 8. Log authentication attempts for security auditing
  // 9. Implement key rotation and expiration mechanisms for enhanced security
  // 10. Add support for different access levels or permissions tied to API keys

  const bearer = bearerAuth({ token: API_SECRET_KEY });
  return bearer(c, next);
};

/**
 * Caching middleware
 * 
 * @description Implements caching for responses in non-development environments
 * @param {Context} c - The Hono context object
 * @param {Next} next - The next middleware function
 * @returns {Response | Promise<void>} The cached response or void if passing to next middleware
 */
const cacheMiddleware = (c: Context, next: Next) => {
  if (process.env.NODE_ENV === "development") {
    return next();
  }

  return cache({
    cacheName: "engine",
    cacheControl: "max-age=3600",
  })(c, next);
};

/**
 * Security headers middleware
 * 
 * @description Adds secure headers to the response
 */
const securityMiddleware = secureHeaders();

/**
 * Logging middleware
 * 
 * @description Logs incoming requests using a custom logger
 */
const loggingMiddleware = logger(customLogger);

/**
 * JSON formatting middleware
 * 
 * @description Formats JSON responses for better readability
 */
const jsonFormattingMiddleware = prettyJSON();

/**
 * Timing middleware
 * 
 * @description Adds timing information to the response headers
 */
const timingMiddleware = timing();

/**
 * CORS middleware
 * 
 * @description Handles Cross-Origin Resource Sharing (CORS) in non-development environments
 * @param {Context} c - The Hono context object
 * @param {Next} next - The next middleware function
 * @returns {Response | Promise<void>} The CORS-enabled response or void if passing to next middleware
 */
const corsMiddleware = (c: Context, next: Next) => {
  if (process.env.NODE_ENV === "development") {
    return next();
  }

  return cors({
    origin: ['https://app-business.solomon-ai.app', 'http://localhost:3001'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['X-Total-Count'],
    maxAge: 3600,
    credentials: true,
  })(c, next);
};

/**
 * Error handling middleware
 * 
 * @description Catches and handles errors thrown during request processing
 * @param {Context} c - The Hono context object
 * @param {Next} next - The next middleware function
 * @returns {Promise<Response>} JSON response with error details
 */
const errorHandlerMiddleware = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    if (error instanceof HTTPException) {
      return c.json({ error: error.message }, error.status);
    }
    console.error(error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};

export {
  authMiddleware,
  cacheMiddleware, corsMiddleware,
  errorHandlerMiddleware, jsonFormattingMiddleware, loggingMiddleware,
  securityMiddleware, timingMiddleware
};

