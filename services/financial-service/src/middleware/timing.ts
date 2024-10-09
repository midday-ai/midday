import { timing } from "hono/timing";

/**
 * Timing middleware
 *
 * @description Adds timing information to the response headers
 */
export const timingMiddleware = timing();