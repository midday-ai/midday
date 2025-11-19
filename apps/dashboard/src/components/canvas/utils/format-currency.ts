import { formatAmount } from "@/utils/format";

/**
 * Format currency amount with fallback to zero amount
 * Replaces the repeated pattern:
 * formatAmount({ currency, amount, locale }) || formatAmount({ currency, amount: 0, locale })
 */
export function formatCurrencyAmount(
  amount: number,
  currency: string,
  locale?: string,
): string {
  const formatted = formatAmount({
    currency,
    amount: amount || 0,
    locale: locale ?? undefined,
  });

  if (formatted) {
    return formatted;
  }

  // Fallback to zero amount
  const fallback = formatAmount({
    currency: currency || "USD",
    amount: 0,
    locale: locale ?? undefined,
  });

  return fallback || "0";
}
