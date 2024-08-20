"use client";

import { useCurrentLocale } from "@/locales/client";
import MotionNumber from "motion-number";

type Props = {
  value: number;
  currency: string;
};

export function AnimatedNumber({ value, currency }: Props) {
  const locale = useCurrentLocale();

  console.log(locale);

  return (
    <MotionNumber
      value={value}
      format={{
        style: "currency",
        currency: currency,
      }}
      locales="en-US" // Intl.NumberFormat() locales
    />
  );
}
