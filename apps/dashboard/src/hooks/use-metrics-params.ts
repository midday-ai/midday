import { formatISO, subYears } from "date-fns";
import { useQueryStates } from "nuqs";
import { parseAsString } from "nuqs/server";
import { useEffect, useRef } from "react";

const STORAGE_KEY = "metrics-date-range";

const getDefaultDateRange = () => {
  const now = new Date();
  const from = subYears(now, 1);
  return {
    from: formatISO(from, { representation: "date" }),
    to: formatISO(now, { representation: "date" }),
  };
};

const getStoredDateRange = (): { from: string; to: string } | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const saveDateRange = (from: string, to: string) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ from, to }));
  } catch {
    // Ignore errors
  }
};

export const metricsParamsSchema = {
  from: parseAsString.withDefault(getDefaultDateRange().from),
  to: parseAsString.withDefault(getDefaultDateRange().to),
};

export function useMetricsParams() {
  const defaults = getDefaultDateRange();
  const [params, setParams] = useQueryStates(metricsParamsSchema, {
    clearOnDefault: true,
  });

  const initialized = useRef(false);

  // Restore from localStorage on mount if URL is at defaults
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const stored = getStoredDateRange();
    const isAtDefaults =
      params.from === defaults.from && params.to === defaults.to;

    if (stored && isAtDefaults) {
      setParams({ from: stored.from, to: stored.to });
    }
  }, [params.from, params.to, defaults.from, defaults.to, setParams]);

  // Save to localStorage when params change
  useEffect(() => {
    if (!initialized.current) return;
    saveDateRange(params.from, params.to);
  }, [params.from, params.to]);

  return {
    from: params.from,
    to: params.to,
    setParams: (updates: { from?: string; to?: string }) => {
      initialized.current = true;
      setParams(updates);
    },
  };
}
