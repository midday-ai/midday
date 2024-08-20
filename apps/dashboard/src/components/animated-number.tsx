"use client";

import { useCurrentLocale } from "@/locales/client";
import MotionNumber from "motion-number";

type Props = {
  value: number;
  currency: string;
};

export function AnimatedNumber({ value, currency }: Props) {
  const locale = useCurrentLocale();

  return (
    <MotionNumber
      value={value}
      format={{
        style: "currency",
        currency: currency,
      }}
      locales={locale}
    />
  );
}
