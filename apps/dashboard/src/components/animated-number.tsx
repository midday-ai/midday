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
    // If value is valid and not NaN
    if (value !== undefined && value !== null && !Number.isNaN(value)) {
      // On first render, always set the value
      if (!hasInitializedRef.current) {
        displayValueRef.current = value;
        setDisplayValue(value);
        hasInitializedRef.current = true;
        return;
      }

      // If we had a previous non-zero value and new value is 0, it's likely a loading state
      // Keep the previous value instead of animating to 0
      if (displayValueRef.current !== 0 && value === 0) {
        // Don't update - preserve previous value during loading
        return;
      }

      // Update display value
      displayValueRef.current = value;
      setDisplayValue(value);
    }
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
