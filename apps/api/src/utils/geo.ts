import type { HonoRequest } from "hono";

export function getGeoContext(req: HonoRequest) {
  const headers = req.header();

  const country = headers["x-user-country"]?.toUpperCase() ?? null;
  const locale = headers["x-user-locale"] ?? null;
  const timezone = headers["x-user-timezone"] ?? null;
  const ip = headers["x-forwarded-for"] ?? null;

  console.log({
    msg: "Geo context",
    country,
    locale,
    timezone,
    ip,
  });

  return {
    country,
    locale,
    timezone,
    ip,
  };
}
