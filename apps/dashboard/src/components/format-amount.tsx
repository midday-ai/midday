"use client";

import { useUserContext } from "@/store/user/hook";
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
  const { data } = useUserContext((state) => state);

  return formatAmount({
    locale: locale || data?.locale,
    amount: amount,
    currency: currency,
    maximumFractionDigits,
    minimumFractionDigits,
  });
}
