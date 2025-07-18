import type { MiddlewareHandler } from "hono";
import { rateLimiter } from "hono-rate-limiter";
import { withAuth } from "./auth";
import { withDatabase } from "./db";
import { withPrimaryReadAfterWrite } from "./primary-read-after-write";

/**
 * Public endpoint middleware - only attaches database with smart routing
 * No authentication required
 */
export const publicMiddleware: MiddlewareHandler[] = [withDatabase];

/**
 * Protected endpoint middleware - requires authentication
 * Supports both API keys and OAuth tokens in a single unified middleware
 * Note: withAuth must be first to set session in context
 */
export const protectedMiddleware: MiddlewareHandler[] = [
  withDatabase,
  withAuth,
  rateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    limit: 100,
    keyGenerator: (c) => {
      return c.get("session")?.user?.id ?? "unknown";
    },
    statusCode: 429,
    message: "Rate limit exceeded",
  }),
  withPrimaryReadAfterWrite,
];

export { withRequiredScope } from "./scope";
