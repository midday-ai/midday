"use client";

import { useUserQuery } from "@/hooks/use-user";
import { formatAmount } from "@/utils/format";

type Props = {
  amount: number;
  currency: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
  locale?: string;
};

export function FormatAmount({
  amount,
  currency,
  maximumFractionDigits,
  minimumFractionDigits,
  locale,
}: Props) {
  const { data: user } = useUserQuery();

  return formatAmount({
    locale: locale || user?.locale,
    amount: amount,
    currency,
    maximumFractionDigits,
    minimumFractionDigits,
  });
}
