import type { MiddlewareHandler } from "hono";
import { rateLimiter } from "hono-rate-limiter";
import { withAuth } from "./auth";
import { withDatabase } from "./db";
import { withPrimaryReadAfterWrite } from "./primary-read-after-write";

/**
 * Get the client IP address from request headers
 * Handles various proxy configurations
 */
const getClientIP = (c: any): string => {
  // Check common proxy headers in order of preference
  const forwardedFor = c.req.header("x-forwarded-for");
  const realIP = c.req.header("x-real-ip");
  const cfConnectingIP = c.req.header("cf-connecting-ip"); // Cloudflare
  const xClientIP = c.req.header("x-client-ip");

  // x-forwarded-for can contain multiple IPs, take the first one
  if (forwardedFor) {
    const firstIP = forwardedFor.split(",")[0].trim();
    if (firstIP) return firstIP;
  }

  // Try other headers
  if (realIP) return realIP;
  if (cfConnectingIP) return cfConnectingIP;
  if (xClientIP) return xClientIP;

  // Fallback to connection remote address (though this might not be available in all environments)
  return c.req.header("remote-addr") || "unknown";
};

/**
 * Public endpoint middleware - only attaches database with smart routing
 * No authentication required, but includes IP-based rate limiting
 */
export const publicMiddleware: MiddlewareHandler[] = [
  withDatabase,
  rateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    limit: 50, // Lower limit for unauthenticated requests
    keyGenerator: (c) => {
      const ip = getClientIP(c);
      return `ip:${ip}`;
    },
    statusCode: 429,
    message: "Rate limit exceeded for unauthenticated requests",
  }),
];

/**
 * Protected endpoint middleware - requires authentication
 * Includes database with smart routing and authentication
 * Note: withAuth must be first to set session in context
 */
export const protectedMiddleware: MiddlewareHandler[] = [
  withDatabase,
  withAuth,
  rateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    limit: 100, // Higher limit for authenticated requests
    keyGenerator: (c) => {
      const session = c.get("session");

      if (session?.user?.id) {
        // Use user ID for authenticated requests
        return `user:${session.user.id}`;
      }

      // Fallback to IP for edge cases where auth middleware didn't set session
      const ip = getClientIP(c);
      return `ip:${ip}`;
    },
    statusCode: 429,
    message: "Rate limit exceeded",
  }),
  withPrimaryReadAfterWrite,
];

export { withRequiredScope } from "./scope";
