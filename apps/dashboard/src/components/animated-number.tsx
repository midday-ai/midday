"use client";

import { useCurrentLocale } from "@/locales/client";
import NumberFlow from "@number-flow/react";

type Props = {
  value: number;
  currency: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

export function AnimatedNumber({
  value,
  currency,
  minimumFractionDigits,
  maximumFractionDigits,
}: Props) {
  const locale = useCurrentLocale();

  return (
    <NumberFlow
      value={value}
      format={{
        style: "currency",
        currency: currency ?? "USD",
        minimumFractionDigits,
        maximumFractionDigits,
        useGrouping: false,
      }}
      willChange
      locales={locale}
    />
  );
}
