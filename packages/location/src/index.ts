import { headers } from "next/headers";
import countries from "./countries.json";
import flags from "./country-flag";

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
  const continent = headers().get("x-vercel-ip-continent") || "EU";

  return continent === "EU";
}

export function getCountry() {
  const country = getCountryCode();

  return flags[country];
}
