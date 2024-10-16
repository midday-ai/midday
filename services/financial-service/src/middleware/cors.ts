import type { Context, Next } from "hono";
import { cors } from "hono/cors";

/**
 * CORS middleware
 *
 * @description Handles Cross-Origin Resource Sharing (CORS) in non-development environments
 * @param {Context} c - The Hono context object
 * @param {Next} next - The next middleware function
 * @returns {Response | Promise<void>} The CORS-enabled response or void if passing to next middleware
 */
export const corsMiddleware = (c: Context, next: Next) => {
  if (process.env.NODE_ENV === "development") {
    return next();
  }

  return cors({
    origin: ["https://app-business.solomon-ai.app", "http://localhost:3001"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
      "X-CSRF-Token",
      "X-API-Key",
      "X-Request-ID",
    ],
    exposeHeaders: [
      "X-Total-Count",
      "X-Request-ID",
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
      "X-Version",
    ],
    maxAge: 86400, // 24 hours
    credentials: true,
  })(c, next);
};
