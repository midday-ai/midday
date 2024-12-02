import { headers } from "next/headers";
import countries from "./countries.json";
import flags from "./country-flags";
import { currencies } from "./currencies";
import { EU_COUNTRY_CODES } from "./eu-countries";
import timezones from "./timezones.json";

export function getCountryCode() {
  return headers().get("x-vercel-ip-country") || "SE";
}

export function getTimezone() {
  return headers().get("x-vercel-ip-timezone") || "Europe/Berlin";
}

export function getLocale() {
  return headers().get("x-vercel-ip-locale") || "en-US";
}

export function getTimezones() {
  return timezones;
}
export function getCurrency() {
  const countryCode = getCountryCode();

  return currencies[countryCode as keyof typeof currencies];
}

export function getDateFormat() {
  const country = getCountryCode();

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

export function getCountryInfo() {
  const country = getCountryCode();

  const countryInfo = countries.find((x) => x.cca2 === country);

  const currencyCode =
    countryInfo && Object.keys(countryInfo.currencies)?.at(0);
  const currency = countryInfo?.currencies[currencyCode];
  const languages =
    countryInfo && Object.values(countryInfo.languages).join(", ");

  return {
    currencyCode,
    currency,
    languages,
  };
}

export function isEU() {
  const countryCode = getCountryCode();

  if (countryCode && EU_COUNTRY_CODES.includes(countryCode)) {
    return true;
  }

  return false;
}

export function getCountry() {
  const country = getCountryCode();

  return flags[country];
}
