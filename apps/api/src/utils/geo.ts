import type { HonoRequest } from "hono";

export function getGeoContext(req: HonoRequest) {
  const headers = req.header();

  const country = headers["cf-ipcountry"]?.toUpperCase() ?? null;
  const locale = headers["accept-language"]?.split(",")[0] ?? null;
  const timezone = headers["x-user-timezone"] ?? null;
  const ip = headers["cf-connecting-ip"] ?? null;

  return {
    country,
    locale,
    timezone,
    ip,
  };
}
