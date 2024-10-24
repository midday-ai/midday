import type { Context, Next } from "hono";
import { cache } from "hono/cache";

/**
 * Caching middleware
 *
 * @description Implements caching for responses in non-development environments
 * @param {Context} c - The Hono context object
 * @param {Next} next - The next middleware function
 * @returns {Response | Promise<void>} The cached response or void if passing to next middleware
 */
export const cacheMiddleware = (c: Context, next: Next) => {
  return cache({
    cacheName: "engine-cache",
    cacheControl: "max-age=3600",
  })(c, next);
};