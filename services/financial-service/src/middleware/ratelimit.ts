import { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import constants from "../constants/constant";


interface RateLimitConfig {
    limit: number;
    window: number;
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
    limit: 5000,
    window: 60, // 60 seconds
};

/**
 * Rate limiter middleware
 *
 * @description Handles rate limiting for protected routes using API key and UserId
 * @param {Context} c - The Hono context object
 * @param {Next} next - The next middleware function
 * @param {RateLimitConfig} [_config] - Optional custom rate limit configuration
 * @returns {Promise<Response | void>} The response or void if passing to next middleware
 * @throws {HTTPException} Throws a 429 error if rate limit is exceeded
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
                // We don't rate limit public paths or requests without API key and user ID
                return next();
            }

            // Use a combination of API key and user ID as the rate limiting key
            const rateLimitKey = `${apiKey}:${userId}:${c.req.method}:${c.req.path}`;

            const { success, limit, remaining, reset } = await c.env.RATE_LIMITER.limit({
                key: rateLimitKey
            });

            // Set rate limit headers
            c.header('X-RateLimit-Limit', limit.toString());
            c.header('X-RateLimit-Remaining', remaining.toString());
            c.header('X-RateLimit-Reset', reset.toString());

            if (!success) {
                throw new HTTPException(429, { message: `Rate limit exceeded for API key: ${apiKey}` });
            }

            // Log rate limit usage (consider using a proper logging service in production)
            c.get('logger').info(`Rate limit for ${rateLimitKey}: ${remaining}/${limit} remaining`);

            await next();
        } catch (error) {
            if (error instanceof HTTPException) {
                throw error;
            }
            console.error('Rate limiting error:', error);
            throw new HTTPException(500, { message: "Internal server error during rate limiting" });
        }
    };
};