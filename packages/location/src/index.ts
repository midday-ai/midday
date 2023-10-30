import { headers } from "next/headers";

export function getCountryCode() {
  const countryCode = headers().get("x-vercel-ip-country") || "SE";

  return countryCode;
}
