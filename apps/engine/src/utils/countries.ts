export const GOCARDLESS_COUNTRIES = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IS",
  "IE",
  "IT",
  "LV",
  "LI",
  "LT",
  "LU",
  "MT",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  "GB",
] as const;

export const PLAID_COUNTRIES = ["US"] as const;

export const TELLER_COUNTRIES = ["US"] as const;

const combinedCountries = [
  ...new Set([
    ...GOCARDLESS_COUNTRIES,
    ...PLAID_COUNTRIES,
    ...TELLER_COUNTRIES,
  ]),
] as const;

export const ALL_COUNTRIES: readonly string[] = combinedCountries;
