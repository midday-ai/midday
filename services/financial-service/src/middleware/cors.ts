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
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["X-Total-Count"],
    maxAge: 3600,
    credentials: true,
  })(c, next);
};