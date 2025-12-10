import type { Context } from "@api/rest/types";
import type { Context as HonoContext } from "hono";
import { getConnInfo } from "hono/bun";

/**
 * Extract client IP address from request
 * Prioritizes x-forwarded-for header (for proxies/load balancers)
 * Falls back to Hono's getConnInfo for direct connections
 */
export function getClientIp(c: HonoContext<Context>): string {
  // Check x-forwarded-for header first (handles proxy/load balancer scenarios)
  // Format: "client-ip, proxy1-ip, proxy2-ip" - we want the first IP
  const forwardedFor = c.req.header("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  // Fallback to Hono's getConnInfo for direct connections
  try {
    const connInfo = getConnInfo(c);
    return connInfo.remote.address ?? "";
  } catch {
    return "";
  }
}
