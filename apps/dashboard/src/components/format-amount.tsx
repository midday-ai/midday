"use client";

import { memo } from "react";
import { useUserQuery } from "@/hooks/use-user";
import { formatAmount } from "@/utils/format";

type Props = {
  amount: number;
  currency: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
  locale?: string;
};

export const FormatAmount = memo(function FormatAmount({
  amount,
  currency,
  maximumFractionDigits,
  minimumFractionDigits,
  locale,
}: Props) {
  const { data: user } = useUserQuery();

  return formatAmount({
    locale: locale || user?.locale,
    amount,
    currency,
    maximumFractionDigits,
    minimumFractionDigits,
  });
});
