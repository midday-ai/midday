"use client";

import { useCurrentLocale } from "@/locales/client";
import MotionNumber from "motion-number";

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
    <MotionNumber
      value={value}
      format={{
        style: "currency",
        currency: currency ?? "USD",
        minimumFractionDigits,
        maximumFractionDigits,
      }}
      locales={locale}
    />
  );
}
