/**
 * Japanese Consumption Tax (消費税) Calculation Utilities
 * Midday-JP
 *
 * Supports:
 * - Standard rate: 10% (標準税率)
 * - Reduced rate: 8% (軽減税率) - for food, newspapers, etc.
 * - Exempt: 0% (非課税) - medical services, education, etc.
 * - Non-taxable: 0% (不課税) - donations, insurance claims, etc.
 */

export type TaxCategory =
  | "standard_10"
  | "reduced_8"
  | "exempt"
  | "non_taxable";

export interface ConsumptionTaxRate {
  category: TaxCategory;
  rate: number;
  label: string;
  labelJa: string;
}

export const CONSUMPTION_TAX_RATES: Record<TaxCategory, ConsumptionTaxRate> = {
  standard_10: {
    category: "standard_10",
    rate: 0.1,
    label: "Standard Rate (10%)",
    labelJa: "標準税率（10%）",
  },
  reduced_8: {
    category: "reduced_8",
    rate: 0.08,
    label: "Reduced Rate (8%)",
    labelJa: "軽減税率（8%）",
  },
  exempt: {
    category: "exempt",
    rate: 0,
    label: "Exempt",
    labelJa: "非課税",
  },
  non_taxable: {
    category: "non_taxable",
    rate: 0,
    label: "Non-taxable",
    labelJa: "不課税",
  },
};

export interface ConsumptionTaxResult {
  /** Tax-exclusive amount (税抜金額) */
  taxExclusiveAmount: number;
  /** Consumption tax amount (消費税額) */
  taxAmount: number;
  /** Tax-inclusive amount (税込金額) */
  taxInclusiveAmount: number;
  /** Applied tax rate */
  rate: number;
  /** Tax category */
  category: TaxCategory;
}

/**
 * Calculate consumption tax from a tax-exclusive amount
 * 税抜金額から消費税を計算
 *
 * @param amount - Tax-exclusive amount (税抜金額)
 * @param category - Tax category (default: standard_10)
 * @returns ConsumptionTaxResult
 */
export function calculateConsumptionTax(
  amount: number,
  category: TaxCategory = "standard_10"
): ConsumptionTaxResult {
  const safeAmount = amount ?? 0;
  const taxInfo = CONSUMPTION_TAX_RATES[category];
  const rate = taxInfo.rate;

  // Round to nearest yen (standard practice in Japan)
  const taxAmount = Math.round(safeAmount * rate);
  const taxInclusiveAmount = safeAmount + taxAmount;

  return {
    taxExclusiveAmount: safeAmount,
    taxAmount,
    taxInclusiveAmount,
    rate,
    category,
  };
}

/**
 * Extract consumption tax from a tax-inclusive amount
 * 税込金額から消費税を抽出
 *
 * @param taxInclusiveAmount - Tax-inclusive amount (税込金額)
 * @param category - Tax category (default: standard_10)
 * @returns ConsumptionTaxResult
 */
export function extractConsumptionTax(
  taxInclusiveAmount: number,
  category: TaxCategory = "standard_10"
): ConsumptionTaxResult {
  const safeTaxInclusiveAmount = taxInclusiveAmount ?? 0;
  const taxInfo = CONSUMPTION_TAX_RATES[category];
  const rate = taxInfo.rate;

  // Calculate tax-exclusive amount: inclusive / (1 + rate)
  const taxExclusiveAmount = Math.round(safeTaxInclusiveAmount / (1 + rate));
  const taxAmount = safeTaxInclusiveAmount - taxExclusiveAmount;

  return {
    taxExclusiveAmount,
    taxAmount,
    taxInclusiveAmount: safeTaxInclusiveAmount,
    rate,
    category,
  };
}

export interface LineItemTaxResult {
  /** Per-item tax results */
  items: Array<{
    amount: number;
    taxAmount: number;
    category: TaxCategory;
  }>;
  /** Total by tax category */
  totals: Record<
    TaxCategory,
    {
      taxExclusiveAmount: number;
      taxAmount: number;
    }
  >;
  /** Grand total tax amount */
  totalTaxAmount: number;
  /** Grand total tax-exclusive amount */
  totalTaxExclusiveAmount: number;
  /** Grand total tax-inclusive amount */
  totalTaxInclusiveAmount: number;
}

/**
 * Calculate consumption tax for multiple line items with different tax categories
 * 複数の明細行（異なる税率）の消費税を計算
 *
 * @param items - Array of line items with amounts and categories
 * @returns LineItemTaxResult
 */
export function calculateLineItemsTax(
  items: Array<{ amount: number; category?: TaxCategory }>
): LineItemTaxResult {
  const safeItems = items ?? [];

  const totals: Record<
    TaxCategory,
    { taxExclusiveAmount: number; taxAmount: number }
  > = {
    standard_10: { taxExclusiveAmount: 0, taxAmount: 0 },
    reduced_8: { taxExclusiveAmount: 0, taxAmount: 0 },
    exempt: { taxExclusiveAmount: 0, taxAmount: 0 },
    non_taxable: { taxExclusiveAmount: 0, taxAmount: 0 },
  };

  const itemResults = safeItems.map((item) => {
    const category = item.category ?? "standard_10";
    const result = calculateConsumptionTax(item.amount, category);

    totals[category].taxExclusiveAmount += result.taxExclusiveAmount;
    totals[category].taxAmount += result.taxAmount;

    return {
      amount: item.amount,
      taxAmount: result.taxAmount,
      category,
    };
  });

  const totalTaxAmount = Object.values(totals).reduce(
    (sum, t) => sum + t.taxAmount,
    0
  );
  const totalTaxExclusiveAmount = Object.values(totals).reduce(
    (sum, t) => sum + t.taxExclusiveAmount,
    0
  );

  return {
    items: itemResults,
    totals,
    totalTaxAmount,
    totalTaxExclusiveAmount,
    totalTaxInclusiveAmount: totalTaxExclusiveAmount + totalTaxAmount,
  };
}

/**
 * Validate an invoice registration number (インボイス登録番号)
 * Format: T + 13 digits (e.g., T1234567890123)
 *
 * @param registrationNumber - The registration number to validate
 * @returns boolean
 */
export function validateInvoiceRegistrationNumber(
  registrationNumber: string | null | undefined
): boolean {
  if (!registrationNumber) return false;

  // Must be T followed by exactly 13 digits
  const pattern = /^T\d{13}$/;
  return pattern.test(registrationNumber);
}

/**
 * Format an invoice registration number for display
 * Adds spaces for readability: T 1234 5678 9012 3
 *
 * @param registrationNumber - The registration number to format
 * @returns Formatted string or empty string if invalid
 */
export function formatInvoiceRegistrationNumber(
  registrationNumber: string | null | undefined
): string {
  if (!registrationNumber || !validateInvoiceRegistrationNumber(registrationNumber)) {
    return "";
  }

  // Format as: T 1234 5678 9012 3
  const digits = registrationNumber.slice(1); // Remove 'T'
  return `T ${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)} ${digits.slice(12)}`;
}
