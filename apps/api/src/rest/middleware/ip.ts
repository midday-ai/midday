import type { MiddlewareHandler } from "hono";
import type { Context } from "../types";
import { getClientIp } from "../utils/ip";

/**
 * Middleware that extracts client IP address and adds it to context
 * Handles proxies/load balancers correctly
 * Uses Hono's getConnInfo helper as fallback
 */
export const withClientIp: MiddlewareHandler<Context> = async (c, next) => {
  const clientIp = getClientIp(c);
  c.set("clientIp", clientIp);

  await next();
};
