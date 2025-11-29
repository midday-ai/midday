"use client";

import { parseAsBoolean, useQueryState } from "nuqs";

export function useMetricsCustomize() {
  const [isCustomizing, setIsCustomizing] = useQueryState(
    "customizeMetrics",
    parseAsBoolean.withDefault(false),
  );

  return {
    isCustomizing: isCustomizing ?? false,
    setIsCustomizing: (value: boolean) => setIsCustomizing(value || null),
  };
}
