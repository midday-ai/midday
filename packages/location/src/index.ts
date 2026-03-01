import { headers } from "next/headers";
import flags from "./country-flags";
import { currencies } from "./currencies";
import timezones from "./timezones.json";

/**
 * Parse the primary locale from an Accept-Language header value.
 * Returns the first language tag (e.g. "en-US" from "en-US,en;q=0.9").
 */
export function parseLocale(acceptLanguage: string | null): string {
  if (!acceptLanguage) return "en-US";
  const primary = acceptLanguage.split(",")[0]?.trim();
  if (!primary) return "en-US";
  return primary.split(";")[0]?.trim() || "en-US";
}

/**
 * Extract all location values from a resolved headers object (Cloudflare headers).
 * Use this when you already have the headers and want to avoid multiple async calls.
 */
export function getLocationHeaders(headersList: {
  get: (name: string) => string | null;
}): {
  country: string;
  timezone: string;
  locale: string;
} {
  return {
    country: headersList.get("cf-ipcountry") || "SE",
    timezone: headersList.get("cf-timezone") || "Europe/Berlin",
    locale: parseLocale(headersList.get("accept-language")),
  };
}

export async function getCountryCode() {
  const headersList = await headers();

  return headersList.get("cf-ipcountry") || "SE";
}

export async function getTimezone() {
  const headersList = await headers();

  return headersList.get("cf-timezone") || "Europe/Berlin";
}

export async function getLocale() {
  const headersList = await headers();

  return parseLocale(headersList.get("accept-language"));
}

export function getTimezones() {
  return timezones;
}
export async function getCurrency() {
  const countryCode = await getCountryCode();

  return currencies[countryCode as keyof typeof currencies];
}

export async function getDateFormat() {
  const country = await getCountryCode();

  // US uses MM/dd/yyyy
  if (country === "US") {
    return "MM/dd/yyyy";
  }

  // China, Japan, Korea, Taiwan use yyyy-MM-dd
  if (["CN", "JP", "KR", "TW"].includes(country)) {
    return "yyyy-MM-dd";
  }
  // Most Latin American, African, and some Asian countries use dd/MM/yyyy
  if (["AU", "NZ", "IN", "ZA", "BR", "AR"].includes(country)) {
    return "dd/MM/yyyy";
  }

  // Default to yyyy-MM-dd for other countries
  return "yyyy-MM-dd";
}

export async function getCountry() {
  const country = await getCountryCode();

  // Type guard to ensure country is a key of flags
  if (country && Object.hasOwn(flags, country)) {
    return flags[country as keyof typeof flags];
  }

  return undefined;
}
