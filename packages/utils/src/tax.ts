export const taxTypes = [
  {
    value: "vat",
    label: "VAT",
    description: "Used in EU, UK, Australia, etc.",
  },
  {
    value: "sales_tax",
    label: "Sales Tax",
    description: "Used in the US and Canada (non-compound).",
  },
  {
    value: "gst",
    label: "GST",
    description: "Used in Australia, New Zealand, Singapore, etc.",
  },
  {
    value: "withholding_tax",
    label: "Withholding Tax",
    description: "Often used in cross-border B2B payments.",
  },
  {
    value: "service_tax",
    label: "Service Tax",
    description: "For niche service-based regions.",
  },
  {
    value: "excise_tax",
    label: "Excise / Special Tax",
    description: "For goods like alcohol, tobacco, fuel.",
  },
  {
    value: "reverse_charge",
    label: "Reverse Charge",
    description: "For EU cross-border VAT or similar systems.",
  },
  {
    value: "custom_tax",
    label: "Custom Tax",
    description: "For unsupported or internal tax logic.",
  },
];

export function getTaxTypeLabel(taxType: string) {
  return taxTypes.find((type) => type.value === taxType)?.label;
}

// Country code to default tax type mapping
const countryTaxMapping: Record<string, string> = {
  // VAT Countries (EU, UK, etc.)
  AT: "vat", // Austria
  BE: "vat", // Belgium
  BG: "vat", // Bulgaria
  HR: "vat", // Croatia
  CY: "vat", // Cyprus
  CZ: "vat", // Czech Republic
  DK: "vat", // Denmark
  EE: "vat", // Estonia
  FI: "vat", // Finland
  FR: "vat", // France
  DE: "vat", // Germany
  GR: "vat", // Greece
  HU: "vat", // Hungary
  IE: "vat", // Ireland
  IT: "vat", // Italy
  LV: "vat", // Latvia
  LT: "vat", // Lithuania
  LU: "vat", // Luxembourg
  MT: "vat", // Malta
  NL: "vat", // Netherlands
  PL: "vat", // Poland
  PT: "vat", // Portugal
  RO: "vat", // Romania
  SK: "vat", // Slovakia
  SI: "vat", // Slovenia
  ES: "vat", // Spain
  SE: "vat", // Sweden
  GB: "vat", // United Kingdom
  NO: "vat", // Norway
  CH: "vat", // Switzerland
  IS: "vat", // Iceland

  // GST Countries
  AU: "gst", // Australia (GST, but also has VAT mentioned in description)
  NZ: "gst", // New Zealand
  SG: "gst", // Singapore
  IN: "gst", // India
  MY: "gst", // Malaysia
  TH: "gst", // Thailand

  // Sales Tax Countries
  US: "sales_tax", // United States
  CA: "sales_tax", // Canada

  // Other common mappings
  JP: "custom_tax", // Japan (has consumption tax)
  KR: "custom_tax", // South Korea
  CN: "custom_tax", // China
  BR: "custom_tax", // Brazil
  MX: "custom_tax", // Mexico
  RU: "custom_tax", // Russia
  ZA: "vat", // South Africa (has VAT)
  AE: "vat", // UAE (has VAT)
  SA: "vat", // Saudi Arabia (has VAT)
};

/**
 * Get the default tax type for a given country code
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., "US", "GB", "DE")
 * @returns The default tax type value, or "custom_tax" if not found
 */
export function getDefaultTaxType(countryCode: string): string {
  if (!countryCode) {
    return "custom_tax";
  }

  const normalizedCode = countryCode.toUpperCase();
  return countryTaxMapping[normalizedCode] || "custom_tax";
}

/**
 * Get the tax type object for a given country code
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns The complete tax type object or the custom_tax object if not found
 */
export function getTaxTypeForCountry(countryCode: string) {
  const taxTypeValue = getDefaultTaxType(countryCode);
  return (
    taxTypes.find((type) => type.value === taxTypeValue) ||
    taxTypes.find((type) => type.value === "custom_tax")!
  );
}

/**
 * Check if a country uses VAT
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns True if the country uses VAT
 */
export function isVATCountry(countryCode: string): boolean {
  return getDefaultTaxType(countryCode) === "vat";
}

/**
 * Check if a country uses GST
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns True if the country uses GST
 */
export function isGSTCountry(countryCode: string): boolean {
  return getDefaultTaxType(countryCode) === "gst";
}

/**
 * Calculate tax amount from a net amount (amount excluding tax) and tax rate
 * Use this only if you have net amounts. For transactions (which are gross),
 * use calculateTaxAmountFromGross instead.
 * Rounds to 2 decimal places to avoid floating-point precision issues
 * Always returns a positive value, even for negative amounts (expenses)
 * @param amount - The net amount excluding tax (can be positive or negative)
 * @param taxRate - The tax rate as a percentage (e.g., 20 for 20%)
 * @returns The calculated tax amount rounded to 2 decimal places (always positive)
 */
export function calculateTaxAmount(amount: number, taxRate: number): number {
  return Math.abs(Math.round(amount * (taxRate / 100) * 100) / 100);
}

/**
 * Calculate tax amount from a gross amount (amount including tax) and tax rate
 * Uses reverse VAT calculation: VAT = Gross × (Rate / (100 + Rate))
 * All transactions are gross amounts, so this is the standard calculation.
 * Rounds to 2 decimal places to avoid floating-point precision issues
 * Always returns a positive value, even for negative amounts (expenses)
 * @param grossAmount - The gross amount including tax (can be positive or negative)
 * @param taxRate - The tax rate as a percentage (e.g., 23 for 23%)
 * @returns The calculated tax amount rounded to 2 decimal places (always positive)
 * @example
 * calculateTaxAmountFromGross(33.84, 23) // Returns 6.33 (not 7.78)
 */
export function calculateTaxAmountFromGross(
  grossAmount: number,
  taxRate: number,
): number {
  return Math.abs(
    Math.round(grossAmount * (taxRate / (100 + taxRate)) * 100) / 100,
  );
}

/**
 * Calculate tax rate percentage from a gross amount (amount including tax) and tax amount
 * Uses reverse calculation: Rate = (Tax × 100) / (Gross - Tax)
 * All transactions are gross amounts, so this is the standard calculation.
 * Rounds to 2 decimal places to avoid floating-point precision issues
 * Always returns a positive value, even for negative amounts (expenses)
 * @param grossAmount - The gross amount including tax (can be positive or negative)
 * @param taxAmount - The tax amount
 * @returns The calculated tax rate as a percentage rounded to 2 decimal places (always positive)
 * @example
 * calculateTaxRateFromGross(100, 20) // Returns 25 (not 20)
 * // Verification: 100 × (25/125) = 20 ✓
 */
export function calculateTaxRateFromGross(
  grossAmount: number,
  taxAmount: number,
): number {
  if (grossAmount === 0 || taxAmount === 0) return 0;
  const netAmount = Math.abs(grossAmount) - taxAmount;
  if (netAmount <= 0) return 0; // Prevent division by zero or negative
  return Math.round((taxAmount / netAmount) * 100 * 100) / 100;
}

/**
 * Calculate tax rate percentage from a net amount (amount excluding tax) and tax amount
 * Use this only if you have net amounts. For transactions (which are gross),
 * use calculateTaxRateFromGross instead.
 * Rounds to 2 decimal places
 * Uses absolute value of amount to ensure positive tax rates for both income and expenses
 * @param amount - The net amount excluding tax (can be positive or negative)
 * @param taxAmount - The tax amount
 * @returns The calculated tax rate as a percentage rounded to 2 decimal places (always positive)
 */
export function calculateTaxRate(amount: number, taxAmount: number): number {
  if (amount === 0) return 0;
  return Math.round((taxAmount / Math.abs(amount)) * 100 * 100) / 100;
}

/**
 * Resolve tax values with priority order:
 * 1. Use stored taxAmount if available (fixed amount mode)
 * 2. Calculate from transaction taxRate if available (percentage mode)
 * 3. Calculate from category taxRate if available (inherited percentage)
 *
 * All transactions are gross (tax-inclusive) amounts, so uses reverse VAT calculation.
 *
 * @param params - Transaction and category tax values
 * @returns Resolved tax values
 */
export function resolveTaxValues(params: {
  transactionAmount: number;
  transactionTaxAmount?: number | null;
  transactionTaxRate?: number | null;
  transactionTaxType?: string | null;
  categoryTaxRate?: number | null;
  categoryTaxType?: string | null;
}): {
  taxAmount: number | null;
  taxRate: number | null;
  taxType: string | null;
} {
  const {
    transactionAmount,
    transactionTaxAmount,
    transactionTaxRate,
    transactionTaxType,
    categoryTaxRate,
    categoryTaxType,
  } = params;

  // Explicitly check for null/undefined to allow 0 as a valid tax amount
  let taxAmount: number | null = null;
  let taxRate: number | null = null;

  if (transactionTaxAmount !== null && transactionTaxAmount !== undefined) {
    // Fixed amount mode - use stored amount (even if it's 0)
    taxAmount = transactionTaxAmount;
    taxRate = transactionTaxRate ?? null;
  } else if (transactionTaxRate !== null && transactionTaxRate !== undefined) {
    // Percentage mode - calculate from transaction's rate
    taxRate = transactionTaxRate;
    taxAmount = calculateTaxAmountFromGross(
      transactionAmount,
      transactionTaxRate,
    );
  } else if (categoryTaxRate !== null && categoryTaxRate !== undefined) {
    // Inherited from category - calculate from category's rate
    taxRate = categoryTaxRate;
    taxAmount = calculateTaxAmountFromGross(transactionAmount, categoryTaxRate);
  }

  const taxType = transactionTaxType ?? categoryTaxType ?? null;

  return { taxAmount, taxRate, taxType };
}
