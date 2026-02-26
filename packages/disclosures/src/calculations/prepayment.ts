/**
 * Estimate prepayment savings if the merchant pays off early.
 *
 * For MCA, prepayment terms vary by provider. This calculates a
 * conservative estimate of savings if the merchant pays off at the
 * halfway point of the term.
 *
 * Most MCA providers require full payback amount regardless of early payoff,
 * meaning prepayment savings = $0. However, some states require disclosure
 * of prepayment policies and potential savings.
 *
 * This function calculates the theoretical savings under a simple
 * pro-rata model (not how most MCAs actually work, but required for
 * comparison disclosure purposes).
 */
export function calculatePrepaymentSavingsEstimate(
  financeCharge: number,
  termLengthDays: number,
  earlyPayoffDays?: number,
): number | null {
  if (termLengthDays <= 0 || financeCharge <= 0) {
    return null;
  }

  // Default: estimate savings at the halfway point
  const payoffPoint = earlyPayoffDays ?? Math.floor(termLengthDays / 2);

  if (payoffPoint >= termLengthDays) {
    return 0;
  }

  // Pro-rata savings: proportion of finance charge for remaining term
  const remainingProportion = (termLengthDays - payoffPoint) / termLengthDays;
  const savings = financeCharge * remainingProportion;

  return Math.round(savings * 100) / 100;
}
