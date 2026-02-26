import { differenceInCalendarDays } from "date-fns";

/**
 * Calculate the term length in calendar days from funded date to expected payoff.
 */
export function calculateTermLengthDays(
  fundedAt: string,
  expectedPayoffDate: string,
): number {
  const start = new Date(fundedAt);
  const end = new Date(expectedPayoffDate);
  return differenceInCalendarDays(end, start);
}

/**
 * Calculate the number of payments based on term and frequency.
 *
 * Daily: business days (approximately 252/365 of calendar days)
 * Weekly: calendar weeks
 * Bi-weekly: every 2 weeks
 * Monthly: calendar months
 */
export function calculateNumberOfPayments(
  termLengthDays: number,
  frequency: "daily" | "weekly" | "bi_weekly" | "monthly",
): number {
  switch (frequency) {
    case "daily":
      // Approximate business days: ~5/7 of calendar days
      return Math.round(termLengthDays * (5 / 7));
    case "weekly":
      return Math.round(termLengthDays / 7);
    case "bi_weekly":
      return Math.round(termLengthDays / 14);
    case "monthly":
      return Math.round(termLengthDays / 30.44); // Average days per month
  }
}

/**
 * Calculate the payment amount if not provided.
 * If dailyPayment is already known, derive for other frequencies.
 * Otherwise, calculate from paybackAmount and number of payments.
 */
export function calculatePaymentAmount(
  paybackAmount: number,
  numberOfPayments: number,
  dailyPayment: number | null,
  frequency: "daily" | "weekly" | "bi_weekly" | "monthly",
): number {
  if (dailyPayment !== null && dailyPayment > 0) {
    // Derive from daily payment for the given frequency
    switch (frequency) {
      case "daily":
        return dailyPayment;
      case "weekly":
        return dailyPayment * 5; // 5 business days per week
      case "bi_weekly":
        return dailyPayment * 10; // 10 business days per 2 weeks
      case "monthly":
        return dailyPayment * 21; // ~21 business days per month
    }
  }

  // Fallback: divide total payback evenly across payments
  if (numberOfPayments > 0) {
    return Math.round((paybackAmount / numberOfPayments) * 100) / 100;
  }

  return 0;
}
