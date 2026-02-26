import type { DealFee } from "../types";

/**
 * Calculate the finance charge for a deal.
 *
 * Finance charge = total repayment amount - net amount financed
 * Where net amount financed = funding amount - fees deducted from proceeds
 *
 * Per state disclosure laws, the finance charge includes ALL costs
 * of the financing: the factor rate markup plus any fees charged.
 */
export function calculateFinanceCharge(
  fundingAmount: number,
  paybackAmount: number,
  fees: DealFee[],
): number {
  const totalFees = calculateTotalFees(fees);
  // Finance charge = (what merchant pays back + fees) - what merchant receives
  // If fees are deducted from proceeds: merchant receives (fundingAmount - totalFees)
  // Total cost to merchant: paybackAmount + totalFees
  // Finance charge: paybackAmount - fundingAmount + totalFees
  return paybackAmount - fundingAmount + totalFees;
}

/**
 * Calculate total repayment amount including fees.
 */
export function calculateTotalRepayment(
  paybackAmount: number,
  fees: DealFee[],
): number {
  return paybackAmount + calculateTotalFees(fees);
}

/**
 * Sum all fee amounts.
 */
export function calculateTotalFees(fees: DealFee[]): number {
  return fees.reduce((sum, fee) => sum + fee.amount, 0);
}

/**
 * Get a breakdown of fees by name and amount.
 */
export function getFeeBreakdown(
  fees: DealFee[],
): { name: string; amount: number }[] {
  return fees.map((fee) => ({
    name: fee.feeName,
    amount: fee.amount,
  }));
}

/**
 * Calculate the net amount financed — what the merchant actually receives.
 * This is the funding amount minus any fees deducted from proceeds.
 */
export function calculateNetAmountFinanced(
  fundingAmount: number,
  fees: DealFee[],
): number {
  const totalFees = calculateTotalFees(fees);
  return fundingAmount - totalFees;
}
