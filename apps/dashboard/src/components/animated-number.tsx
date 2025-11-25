"use client";

import { useUserQuery } from "@/hooks/use-user";
import NumberFlow from "@number-flow/react";
import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  currency: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  locale?: string;
};

export function AnimatedNumber({
  value,
  currency,
  minimumFractionDigits,
  maximumFractionDigits,
  locale,
}: Props) {
  const { data: user } = useUserQuery();
  const localeToUse = locale || user?.locale;
  const [displayValue, setDisplayValue] = useState<number>(value);
  const displayValueRef = useRef<number>(value);
  const hasInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    // If value is valid and not NaN, always update
    // Note: 0 is a legitimate value (e.g., zero profit, zero runway), so we should update to it
    if (value !== undefined && value !== null && !Number.isNaN(value)) {
      // On first render, always set the value
      if (!hasInitializedRef.current) {
        displayValueRef.current = value;
        setDisplayValue(value);
        hasInitializedRef.current = true;
        return;
      }

      // Update display value (including when value is 0, as it's a legitimate value)
      displayValueRef.current = value;
      setDisplayValue(value);
    }
    // If value is undefined/null/NaN, preserve the previous value (this indicates loading)
  }, [value]);

  return (
    <NumberFlow
      value={displayValue}
      format={{
        style: "currency",
        currency: currency ?? "USD",
        minimumFractionDigits,
        maximumFractionDigits,
      }}
      willChange
      locales={localeToUse ?? "en"}
    />
  );
}
