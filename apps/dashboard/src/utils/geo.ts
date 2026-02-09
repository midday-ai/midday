import type { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";

export type Geo = {
  country?: string;
  city?: string;
  continent?: string;
  region?: string;
  regionCode?: string;
  latitude?: string;
  longitude?: string;
  timezone?: string;
  postalCode?: string;
};

/**
 * Extract geolocation from Cloudflare headers.
 * Requires "Add visitor location headers" managed transform enabled in Cloudflare.
 * Falls back gracefully when headers aren't present.
 */
export function geolocation(headers: ReadonlyHeaders): Geo {
  return {
    country: headers.get("cf-ipcountry") ?? undefined,
    city: headers.get("cf-ipcity") ?? undefined,
    continent: headers.get("cf-ipcontinent") ?? undefined,
    region: headers.get("cf-region") ?? undefined,
    regionCode: headers.get("cf-region-code") ?? undefined,
    latitude: headers.get("cf-iplatitude") ?? undefined,
    longitude: headers.get("cf-iplongitude") ?? undefined,
    timezone: headers.get("cf-timezone") ?? undefined,
    postalCode: headers.get("cf-postal-code") ?? undefined,
  };
}
