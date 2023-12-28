"use client";

import { useCurrentLocale } from "@/locales/client";
import { formatAmount } from "@/utils/format";

export function FormatAmount({
  amount,
  currency,
  maximumFractionDigits,
  minimumFractionDigits,
}) {
  const locale = useCurrentLocale();

  return formatAmount({
    locale,
    amount: amount,
    currency: currency,
    maximumFractionDigits,
    minimumFractionDigits,
  });
}
