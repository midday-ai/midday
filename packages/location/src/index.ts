import { headers } from "next/headers";
import countries from "./countries.json";
import flags from "./country-flag";
import { EU_COUNTRY_CODES } from "./eu-countries";

export function getCountryCode() {
  return headers().get("x-vercel-ip-country") || "SE";
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
