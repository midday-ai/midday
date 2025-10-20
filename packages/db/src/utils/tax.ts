/**
 * Calculate tax amount from a percentage rate
 * @param amount - The transaction amount
 * @param rate - The tax rate as a percentage (e.g., 25 for 25%)
 * @returns The calculated tax amount
 */
export function calculateTaxAmount(amount: number, rate: number): number {
  return Math.abs(+(amount * (rate / 100)).toFixed(2));
}

/**
 * Resolve tax values with priority order:
 * 1. Use stored taxAmount if available (fixed amount mode)
 * 2. Calculate from transaction taxRate if available (percentage mode)
 * 3. Calculate from category taxRate if available (inherited percentage)
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
    taxAmount = calculateTaxAmount(transactionAmount, transactionTaxRate);
  } else if (categoryTaxRate !== null && categoryTaxRate !== undefined) {
    // Inherited from category - calculate from category's rate
    taxRate = categoryTaxRate;
    taxAmount = calculateTaxAmount(transactionAmount, categoryTaxRate);
  }

  const taxType = transactionTaxType ?? categoryTaxType ?? null;

  return { taxAmount, taxRate, taxType };
}
