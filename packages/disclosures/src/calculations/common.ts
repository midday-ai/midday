/**
 * Calculate cents on the dollar — a common MCA metric.
 *
 * This is the factor rate expressed as how many cents the merchant
 * pays per dollar funded. A factor rate of 1.35 = 135 cents per dollar,
 * or equivalently, the merchant pays $1.35 for every $1.00 received.
 *
 * @param paybackAmount - Total amount to be repaid
 * @param fundingAmount - Amount funded/advanced
 * @returns Ratio (e.g., 1.35)
 */
export function calculateCentsOnDollar(
  paybackAmount: number,
  fundingAmount: number,
): number {
  if (fundingAmount <= 0) return 0;
  return Math.round((paybackAmount / fundingAmount) * 10000) / 10000;
}

/**
 * Calculate average monthly cost of the financing.
 *
 * Total repayment amount (including fees) divided by term in months.
 *
 * @param totalRepayment - Total amount repaid including fees
 * @param fundingAmount - Original funding amount
 * @param termLengthDays - Term in calendar days
 * @returns Average monthly cost in dollars
 */
export function calculateAverageMonthlyCost(
  totalRepayment: number,
  fundingAmount: number,
  termLengthDays: number,
): number {
  if (termLengthDays <= 0) return 0;
  const termMonths = termLengthDays / 30.44; // Average days per month
  const totalCost = totalRepayment - fundingAmount;
  return Math.round((totalCost / termMonths) * 100) / 100;
}
