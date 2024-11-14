import { headers } from "next/headers";
import countries from "./countries.json";
import flags from "./country-flags";
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
  const countryCode = headers().get("x-vercel-ip-country");

  if (countryCode && EU_COUNTRY_CODES.includes(countryCode)) {
    return true;
  }

  return false;
}

export function getCountry() {
  const country = getCountryCode();

  return flags[country];
}
