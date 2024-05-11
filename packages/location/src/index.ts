import { headers } from "next/headers";
import { EU_COUNTRY_CODES } from "./countries";
import countries from "./countries.json";
import flags from "./country-flag";

export function getCountryCode() {
  const countryCode = headers().get("x-vercel-ip-country") || "SE";

  return countryCode;
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

export function isEUCountry(countryCode: string) {
  if (EU_COUNTRY_CODES.includes(countryCode)) {
    return true;
  }

  return false;
}

export function getCountry() {
  const country = getCountryCode();

  return flags[country];
}
