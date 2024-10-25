import { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import constants from "../constants/constant";

interface RateLimitConfig {
  limit: number;
  window: number;
}

interface RateLimitResponse {
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  limit: 500000000,
  window: 1, // 1 second
};

const DEFAULT_RATE_LIMIT_RESPONSE: Required<Omit<RateLimitResponse, 'success'>> = {
  limit: DEFAULT_RATE_LIMIT.limit,
  remaining: DEFAULT_RATE_LIMIT.limit,
  reset: Math.floor(Date.now() / 1000) + DEFAULT_RATE_LIMIT.window,
};

/**
 * Sanitizes rate limit values to ensure they are valid numbers
 */
const sanitizeRateLimitValue = (value: unknown, defaultValue: number): number => {
  if (typeof value === 'number' && !isNaN(value) && value >= 0) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return defaultValue;
};


/**
 * Rate limiter middleware
 */
export const rateLimit = (_config: RateLimitConfig = DEFAULT_RATE_LIMIT) => {
  return async (c: Context, next: Next): Promise<Response | void> => {
    try {
      if (constants.PUBLIC_PATHS.includes(c.req.path)) {
        return next();
      }

      const apiKey = c.req.header("X-API-Key");
      const userId = c.req.header("X-User-Id");

      if (!apiKey || !userId) {
        return next();
      }

      const rateLimitKey = `${apiKey}:${userId}:${c.req.method}:${c.req.path}`;

      let rateLimitResponse: RateLimitResponse;

      try {
        // Safely destructure the rate limiter response with defaults
        const response = await c.env.RATE_LIMITER.limit({ key: rateLimitKey });

        // Ensure we have a response object
        if (!response || typeof response !== 'object') {
          throw new Error('Invalid rate limiter response');
        }

        // Extract values with type checking and defaults
        const success = Boolean(response.success);
        const limit = 'limit' in response ? response.limit : DEFAULT_RATE_LIMIT_RESPONSE.limit;
        const remaining = 'remaining' in response ? response.remaining : DEFAULT_RATE_LIMIT_RESPONSE.remaining;
        const reset = 'reset' in response ? response.reset : DEFAULT_RATE_LIMIT_RESPONSE.reset;

        rateLimitResponse = { success, limit, remaining, reset };
      } catch (error) {
        rateLimitResponse = {
          success: true,
          ...DEFAULT_RATE_LIMIT_RESPONSE
        };
      }

      // Sanitize all values
      const sanitizedLimit = sanitizeRateLimitValue(
        rateLimitResponse.limit,
        DEFAULT_RATE_LIMIT_RESPONSE.limit
      );

      const sanitizedRemaining = sanitizeRateLimitValue(
        rateLimitResponse.remaining,
        rateLimitResponse.success ? Math.max(0, sanitizedLimit - 1) : 0
      );

      const sanitizedReset = sanitizeRateLimitValue(
        rateLimitResponse.reset,
        DEFAULT_RATE_LIMIT_RESPONSE.reset
      );

      // Set rate limit headers
      c.header("X-RateLimit-Limit", sanitizedLimit.toString());
      c.header("X-RateLimit-Remaining", sanitizedRemaining.toString());
      c.header("X-RateLimit-Reset", sanitizedReset.toString());

      // Add debug headers in non-production
      if (c.env.ENVIRONMENT !== "production") {
        c.header("X-RateLimit-Debug-Key", rateLimitKey);
        c.header("X-RateLimit-Debug-Time", Date.now().toString());
        c.header("X-RateLimit-Debug-Raw", JSON.stringify(rateLimitResponse));
      }

      if (!rateLimitResponse.success) {
        const retryAfter = Math.max(0, sanitizedReset - Math.floor(Date.now() / 1000));
        c.header("Retry-After", retryAfter.toString());

        throw new HTTPException(429, {
          message: "Rate limit exceeded. Please try again later.",
        });
      }

      await next();


      return;
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      throw new HTTPException(500, {
        message: "Internal server error during rate limiting",
      });
    }
  };
};