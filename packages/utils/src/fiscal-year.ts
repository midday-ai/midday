import { format } from "date-fns";

// Country code to fiscal year start month mapping
// null = use trailing 12 months (no fixed fiscal year)
const countryFiscalYearMapping: Record<string, number | null> = {
  // January (Calendar Year) - Most of Europe
  AT: 1, // Austria
  BE: 1, // Belgium
  BG: 1, // Bulgaria
  HR: 1, // Croatia
  CY: 1, // Cyprus
  CZ: 1, // Czech Republic
  DK: 1, // Denmark
  EE: 1, // Estonia
  FI: 1, // Finland
  FR: 1, // France
  DE: 1, // Germany
  GR: 1, // Greece
  HU: 1, // Hungary
  IT: 1, // Italy
  LV: 1, // Latvia
  LT: 1, // Lithuania
  LU: 1, // Luxembourg
  MT: 1, // Malta
  NL: 1, // Netherlands
  PL: 1, // Poland
  PT: 1, // Portugal
  RO: 1, // Romania
  SK: 1, // Slovakia
  SI: 1, // Slovenia
  ES: 1, // Spain
  SE: 1, // Sweden
  NO: 1, // Norway
  CH: 1, // Switzerland
  IS: 1, // Iceland
  CN: 1, // China
  JP: 1, // Japan (though many companies use April)
  KR: 1, // South Korea
  BR: 1, // Brazil
  MX: 1, // Mexico
  RU: 1, // Russia
  AE: 1, // UAE
  SA: 1, // Saudi Arabia
  IE: 1, // Ireland

  // April - UK, India, Japan (common), Singapore
  GB: 4, // United Kingdom
  IN: 4, // India
  SG: 4, // Singapore
  HK: 4, // Hong Kong

  // July - Australia, Pakistan, Egypt
  AU: 7, // Australia
  PK: 7, // Pakistan
  EG: 7, // Egypt

  // March - South Africa, New Zealand
  ZA: 3, // South Africa
  NZ: 4, // New Zealand

  // October - Thailand (some companies)
  TH: 1, // Thailand (default to January)

  // Default to calendar year for North America
  US: 1, // United States
  CA: 1, // Canada

  // Others
  MY: 1, // Malaysia
};

/**
 * Get the default fiscal year start month for a given country code
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., "US", "GB", "AU")
 * @returns The fiscal year start month (1-12), or null for trailing 12 months
 */
export function getDefaultFiscalYearStartMonth(
  countryCode: string | null | undefined,
): number | null {
  if (!countryCode) {
    return null; // Default to trailing 12 months
  }

  const normalizedCode = countryCode.toUpperCase();
  return countryFiscalYearMapping[normalizedCode] ?? null;
}

/**
 * Get a human-readable label for the fiscal year start month
 */
export function getFiscalYearLabel(month: number | null): string {
  if (!month) return "Trailing 12 months";

  // Create a date with the target month and format it
  const date = new Date(2024, month - 1, 1);
  return format(date, "MMMM");
}

/**
 * Get fiscal year dates based on start month
 */
export function getFiscalYearDates(
  fiscalYearStartMonth: number | null | undefined,
  referenceDate = new Date(),
): { from: Date; to: Date } {
  // No fiscal year set? Use trailing 12 months
  if (!fiscalYearStartMonth) {
    const to = new Date(referenceDate);
    const from = new Date(referenceDate);
    from.setMonth(from.getMonth() - 11);
    from.setDate(1); // Start of month

    // End of current month
    to.setMonth(to.getMonth() + 1);
    to.setDate(0);

    return { from, to };
  }

  // Calculate fiscal year boundaries
  const year = referenceDate.getFullYear();
  const fiscalStart = new Date(year, fiscalYearStartMonth - 1, 1);

  // If we haven't reached fiscal year start yet, we're in previous fiscal year
  const fiscalYearStart =
    referenceDate < fiscalStart
      ? new Date(year - 1, fiscalYearStartMonth - 1, 1)
      : fiscalStart;

  // Fiscal year end is one year later, last day of previous month
  const fiscalYearEnd = new Date(
    fiscalYearStart.getFullYear() + 1,
    fiscalYearStart.getMonth(),
    0, // Last day of previous month
  );

  return { from: fiscalYearStart, to: fiscalYearEnd };
}

/**
 * Get fiscal year-to-date (from fiscal year start to today)
 */
export function getFiscalYearToDate(
  fiscalYearStartMonth: number | null | undefined,
  referenceDate = new Date(),
): { from: Date; to: Date } {
  const { from } = getFiscalYearDates(fiscalYearStartMonth, referenceDate);
  return { from, to: referenceDate };
}
