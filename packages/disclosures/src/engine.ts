import {
  calculateAPR,
  calculateAverageMonthlyCost,
  calculateCentsOnDollar,
  calculateFinanceCharge,
  calculateNetAmountFinanced,
  calculateNumberOfPayments,
  calculatePaymentAmount,
  calculateTermLengthDays,
  calculateTotalFees,
  calculateTotalRepayment,
  getFeeBreakdown,
  getPeriodsPerYear,
} from "./calculations";
import { calculatePrepaymentSavingsEstimate } from "./calculations/prepayment";
import { getStateConfig } from "./states";
import type {
  DealTerms,
  DisclosureFigures,
  StateDisclosureConfig,
} from "./types";

/** Bump this when calculation logic changes */
const CALCULATION_VERSION = "1.0.0";

/**
 * Main disclosure calculation engine.
 *
 * Pure function: takes deal terms and state config, returns all calculated figures.
 * Does NOT touch the database. The caller handles persistence.
 *
 * All calculations are deterministic and algebraic — no AI, no randomness.
 */
export function calculateDisclosureFigures(
  dealTerms: DealTerms,
  stateConfig: StateDisclosureConfig,
): DisclosureFigures {
  const termLengthDays = calculateTermLengthDays(
    dealTerms.fundedAt,
    dealTerms.expectedPayoffDate,
  );

  const numberOfPayments = calculateNumberOfPayments(
    termLengthDays,
    dealTerms.paymentFrequency,
  );

  const paymentAmount = calculatePaymentAmount(
    dealTerms.paybackAmount,
    numberOfPayments,
    dealTerms.dailyPayment,
    dealTerms.paymentFrequency,
  );

  const totalFees = calculateTotalFees(dealTerms.fees);
  const feeBreakdown = getFeeBreakdown(dealTerms.fees);
  const totalRepaymentAmount = calculateTotalRepayment(
    dealTerms.paybackAmount,
    dealTerms.fees,
  );
  const financeCharge = calculateFinanceCharge(
    dealTerms.fundingAmount,
    dealTerms.paybackAmount,
    dealTerms.fees,
  );

  const netAmountFinanced = calculateNetAmountFinanced(
    dealTerms.fundingAmount,
    dealTerms.fees,
  );

  const periodsPerYear = getPeriodsPerYear(dealTerms.paymentFrequency);
  const annualPercentageRate = calculateAPR(
    netAmountFinanced,
    paymentAmount,
    numberOfPayments,
    periodsPerYear,
  );

  const averageMonthlyCost = calculateAverageMonthlyCost(
    totalRepaymentAmount,
    dealTerms.fundingAmount,
    termLengthDays,
  );

  const centsOnDollar = calculateCentsOnDollar(
    dealTerms.paybackAmount,
    dealTerms.fundingAmount,
  );

  const prepaymentSavingsEstimate = calculatePrepaymentSavingsEstimate(
    financeCharge,
    termLengthDays,
  );

  return {
    fundingAmount: dealTerms.fundingAmount,
    totalRepaymentAmount,
    financeCharge,
    annualPercentageRate,
    averageMonthlyCost,
    centsOnDollar,
    paymentAmount,
    paymentFrequency: dealTerms.paymentFrequency,
    numberOfPayments,
    termLengthDays,
    totalFees,
    feeBreakdown,
    prepaymentSavingsEstimate,
    calculatedAt: new Date().toISOString(),
    calculationVersion: CALCULATION_VERSION,
  };
}

/**
 * Look up the applicable state config for a merchant's state.
 * Returns null if the state has no disclosure requirements or is pending.
 */
export function getApplicableState(
  merchantState: string,
): StateDisclosureConfig | null {
  const config = getStateConfig(merchantState);
  if (!config || config.status !== "active") {
    return null;
  }
  return config;
}

/**
 * Check if a deal is subject to disclosure requirements.
 * A deal is subject when:
 * 1. The merchant's state has active disclosure requirements
 * 2. The funding amount is below the state's threshold
 */
export function isDealSubjectToDisclosure(
  dealTerms: DealTerms,
  stateConfig: StateDisclosureConfig,
): boolean {
  return (
    stateConfig.status === "active" &&
    dealTerms.fundingAmount <= stateConfig.maxFundingThreshold
  );
}
