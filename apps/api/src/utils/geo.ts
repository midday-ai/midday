import type { HonoRequest } from "hono";

export function getGeoContext(req: HonoRequest) {
  const headers = req.header();

  // Client-sent headers take priority, fall back to Cloudflare geo headers
  const country =
    headers["x-user-country"]?.toUpperCase() ?? headers["cf-ipcountry"] ?? null;
  const locale = headers["x-user-locale"] ?? null;
  const timezone = headers["x-user-timezone"] ?? headers["cf-timezone"] ?? null;
  const city = headers["cf-ipcity"] ?? null;
  const region = headers["cf-region"] ?? null;
  const continent = headers["cf-ipcontinent"] ?? null;
  const ip = headers["cf-connecting-ip"] ?? headers["x-forwarded-for"] ?? null;

  return {
    country,
    city,
    region,
    continent,
    locale,
    timezone,
    ip,
  };
}
