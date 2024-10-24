import { AllRoutes, CachedRoutes } from "@/route-definitions/routes";
import type { Context, Next } from "hono";
import { cache } from "hono/cache";

interface CacheConfig {
  // Duration in seconds for cache to live
  maxAge?: number;
  // Custom cache key generator
  cacheKeyGenerator?: (c: Context) => string;
  // Paths or patterns to exclude from caching
  excludePaths?: (string | RegExp)[];
  // Headers that should bust the cache
  varyHeaders?: string[];
  // Custom cache name
  cacheName?: string;
  // Function to determine if request should bypass cache
  shouldBypass?: (c: Context) => boolean;
  // Whether to cache errors (4xx, 5xx responses)
  cacheErrors?: boolean;
}

const DEFAULT_CONFIG: CacheConfig = {
  maxAge: 3600,
  cacheName: "engine",
  excludePaths: ["/api/auth", "/api/webhook"],
  varyHeaders: ["Accept", "Accept-Language"],
  cacheErrors: false,
};

/**
 * Generate a unique cache key based on request properties
 * @param c Context object
 * @param varyHeaders Headers to include in cache key
 * @returns Unique cache key string
 */
const generateCacheKey = (c: Context, varyHeaders: string[] = []): string => {
  const url = new URL(c.req.url);
  const headerValues = varyHeaders
    .map(header => c.req.header(header))
    .filter(Boolean)
    .join(":");

  return `${url.pathname}${url.search}${headerValues ? ":" + headerValues : ""}`;
};

/**
 * Check if path matches any exclude patterns
 * @param path Path to check
 * @param excludePaths Array of paths or patterns to exclude
 * @returns Boolean indicating if path should be excluded
 */
const shouldExcludePath = (path: string, excludePaths: (string | RegExp)[] = []): boolean => {
  return excludePaths.some(pattern => {
    if (pattern instanceof RegExp) {
      return pattern.test(path);
    }
    return path.startsWith(pattern);
  });
};

/**
 * Enhanced caching middleware for Hono applications
 *
 * Features:
 * - Configurable cache duration per route
 * - Custom cache key generation
 * - Path exclusions
 * - Vary header support
 * - Cache bypass options
 * - Error response handling
 *
 * @param config Cache configuration options
 * @returns Middleware function
 */
export const createCacheMiddleware = (userConfig: Partial<CacheConfig> = {}) => {
  const config: CacheConfig = { ...DEFAULT_CONFIG, ...userConfig };
  const cachedRoute = CachedRoutes.map(route => route.path);
  const allRoutes = AllRoutes.map(route => route.path);
  const nonCachedRoutes = allRoutes.filter(route => !cachedRoute.includes(route));
  config.excludePaths = [...(config.excludePaths ?? []), ...nonCachedRoutes];

  return async (c: Context, next: Next) => {
    // Skip caching for non-GET requests
    if (c.req.method !== "GET") {
      return next();
    }

    const url = new URL(c.req.url);

    // Check exclusions
    if (shouldExcludePath(url.pathname, config.excludePaths)) {
      return next();
    }

    // Check custom bypass condition
    if (config.shouldBypass?.(c)) {
      return next();
    }

    // Generate cache key
    const cacheKey = config.cacheKeyGenerator?.(c) ??
      generateCacheKey(c, config.varyHeaders);

    // Implement the actual caching using Hono's cache middleware
    return cache({
      cacheName: config.cacheName ?? 'default-cache',
      cacheControl: `max-age=${config.maxAge}`,
      // Custom cache key generator
      keyGenerator: () => cacheKey,
    })(c, next);
  };
};

/**
 * Usage example:
 *
 * const app = new Hono();
 * 
 * // Basic usage
 * app.use('*', createCacheMiddleware());
 * 
 * // Advanced usage
 * app.use('*', createCacheMiddleware({
 *   maxAge: 7200,
 *   excludePaths: ['/api/private', /^\/admin/],
 *   varyHeaders: ['Accept-Language'],
 *   shouldBypass: (c) => c.req.header('Cache-Control') === 'no-cache',
 *   cacheErrors: true
 * }));
 */