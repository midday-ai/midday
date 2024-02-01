import { headers } from "next/headers";
import countries from "./countries.json";

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
