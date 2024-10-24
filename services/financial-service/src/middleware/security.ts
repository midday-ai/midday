import { secureHeaders } from "hono/secure-headers";

/**
 * Security headers middleware
 *
 * @description Adds secure headers to the response
 */
export const securityMiddleware = secureHeaders();
