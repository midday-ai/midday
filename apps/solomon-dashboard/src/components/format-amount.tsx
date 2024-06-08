"use client";

import { useCurrentLocale } from "@/locales/client";
import { formatAmount } from "@/utils/format";

type Props = {
  amount: number;
  currency: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
};

export function FormatAmount({
  amount,
  currency,
  maximumFractionDigits,
  minimumFractionDigits,
}: Props) {
  const locale = useCurrentLocale();

  return formatAmount({
    locale,
    amount: amount,
    currency: currency,
    maximumFractionDigits,
    minimumFractionDigits,
  });
}
