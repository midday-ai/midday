"use client";

import { useTeamQuery } from "@/hooks/use-team";
import {
  type PeriodOption,
  getPeriodDateRange,
} from "@/utils/metrics-date-utils";
import { useQueryStates } from "nuqs";
import { parseAsString } from "nuqs/server";
import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "analytics-filter-preferences";

type RevenueType = "gross" | "net";

interface StoredPreferences {
  period: PeriodOption;
  revenueType: RevenueType;
  currency: string | null;
  customFrom?: string;
  customTo?: string;
}

const getDefaultPreferences = (): StoredPreferences => ({
  period: "1-year",
  revenueType: "net",
  currency: null,
});

const getStoredPreferences = (): StoredPreferences | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const savePreferences = (prefs: StoredPreferences) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore errors
  }
};

export const analyticsFilterSchema = {
  period: parseAsString.withDefault("1-year"),
  revenueType: parseAsString.withDefault("net"),
  currency: parseAsString,
  from: parseAsString,
  to: parseAsString,
};

export function useAnalyticsFilter() {
  const { data: team } = useTeamQuery();
  const fiscalYearStartMonth = team?.fiscalYearStartMonth;

  const [params, setParams] = useQueryStates(analyticsFilterSchema, {
    clearOnDefault: true,
  });

  const mounted = useRef(false);
  const hasLoadedFromStorage = useRef(false);
  const [storedState, setStoredState] = useState<StoredPreferences | null>(
    null,
  );

  // Load from localStorage once on mount
  useEffect(() => {
    mounted.current = true;
    if (hasLoadedFromStorage.current) return;

    const stored = getStoredPreferences();
    if (stored) {
      setStoredState(stored);
    }
    hasLoadedFromStorage.current = true;
  }, []);

  // Mark initial load as complete once we've had a chance to use storedState
  useEffect(() => {
    if (hasLoadedFromStorage.current && mounted.current) {
      // After storedState is loaded (or confirmed empty), allow saves on next cycle
      const timer = setTimeout(() => {
        isInitialLoad.current = false;
      }, 100); // Small delay to ensure state has settled
      return () => clearTimeout(timer);
    }
  }, [storedState]);

  // Determine if URL is at defaults
  const isAtDefaults = useMemo(() => {
    const defaultPrefs = getDefaultPreferences();
    const currentPeriod = (params.period as PeriodOption) || "1-year";
    const currentRevenueType = (params.revenueType as RevenueType) || "net";
    return (
      currentPeriod === defaultPrefs.period &&
      currentRevenueType === defaultPrefs.revenueType &&
      !params.currency &&
      !params.from &&
      !params.to
    );
  }, [
    params.period,
    params.revenueType,
    params.currency,
    params.from,
    params.to,
  ]);

  // Determine effective period (URL params take precedence, otherwise use stored)
  const effectivePeriod = useMemo(() => {
    if (!mounted.current) {
      return (params.period as PeriodOption) || "1-year";
    }

    // If URL has explicit params, use them
    if (!isAtDefaults) {
      return (params.period as PeriodOption) || "1-year";
    }

    // URL is at defaults, use stored if available
    if (storedState) {
      return storedState.period;
    }

    // Otherwise use defaults
    return "1-year";
  }, [params.period, isAtDefaults, storedState]);

  const effectiveRevenueType = useMemo(() => {
    if (!mounted.current) {
      return (params.revenueType as RevenueType) || "net";
    }

    if (!isAtDefaults) {
      return (params.revenueType as RevenueType) || "net";
    }

    if (storedState) {
      return storedState.revenueType;
    }

    return "net";
  }, [params.revenueType, isAtDefaults, storedState]);

  const effectiveCurrency = useMemo(() => {
    if (!mounted.current) {
      return params.currency || null;
    }

    if (!isAtDefaults) {
      return params.currency || null;
    }

    if (storedState) {
      return storedState.currency;
    }

    return null;
  }, [params.currency, isAtDefaults, storedState]);

  // Calculate from/to dates based on effective period
  const dateRange = useMemo(() => {
    // If URL has explicit from/to, use them
    if (params.from && params.to) {
      return { from: params.from, to: params.to };
    }

    // Otherwise, calculate from effective period (or stored custom dates)
    const periodToUse = effectivePeriod;
    const customFrom = storedState?.customFrom;
    const customTo = storedState?.customTo;

    // If period is custom and we have stored custom dates, use them
    if (periodToUse === "custom" && customFrom && customTo) {
      return { from: customFrom, to: customTo };
    }

    // Otherwise, calculate from period
    return getPeriodDateRange(
      periodToUse,
      fiscalYearStartMonth,
      customFrom,
      customTo,
    );
  }, [
    effectivePeriod,
    storedState,
    params.from,
    params.to,
    fiscalYearStartMonth,
  ]);

  // Determine if filter is ready (localStorage loaded and values determined)
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ready when:
    // 1. Component is mounted
    // 2. localStorage has been loaded (or confirmed empty)
    if (mounted.current && hasLoadedFromStorage.current) {
      setIsReady(true);
    }
  }, [storedState]);

  // Save to localStorage when user explicitly changes values (not on initial load)
  const isInitialLoad = useRef(true);
  useEffect(() => {
    if (!mounted.current) return;
    if (!hasLoadedFromStorage.current) return;
    if (isInitialLoad.current) return; // Skip saves during initial load

    const prefs: StoredPreferences = {
      period: effectivePeriod,
      revenueType: effectiveRevenueType,
      currency: effectiveCurrency,
      customFrom: dateRange.from || undefined,
      customTo: dateRange.to || undefined,
    };

    // Compare against what's actually in localStorage to avoid unnecessary saves
    const currentStored = getStoredPreferences();
    if (
      currentStored &&
      currentStored.period === prefs.period &&
      currentStored.revenueType === prefs.revenueType &&
      currentStored.currency === prefs.currency &&
      currentStored.customFrom === prefs.customFrom &&
      currentStored.customTo === prefs.customTo
    ) {
      // Values match what's stored, just sync state without saving
      if (
        !storedState ||
        storedState.period !== prefs.period ||
        storedState.revenueType !== prefs.revenueType ||
        storedState.currency !== prefs.currency
      ) {
        setStoredState(prefs);
      }
      return;
    }

    // Values changed, update stored state and save
    setStoredState(prefs);
    savePreferences(prefs);
  }, [
    effectivePeriod,
    effectiveRevenueType,
    effectiveCurrency,
    dateRange.from,
    dateRange.to,
    storedState,
  ]);

  // Update URL params when period changes
  const updatePeriod = (period: PeriodOption) => {
    isInitialLoad.current = false; // User action, allow save

    // If switching to custom, keep existing dates if they exist
    if (period === "custom" && params.from && params.to) {
      setParams({ period });
      return;
    }

    // Otherwise, calculate new date range from period
    const newDateRange = getPeriodDateRange(period, fiscalYearStartMonth);

    setParams({
      period,
      from: newDateRange.from,
      to: newDateRange.to,
    });
  };

  const updateRevenueType = (revenueType: RevenueType) => {
    isInitialLoad.current = false; // User action, allow save
    setParams({ revenueType });
  };

  const updateCurrency = (currency: string | null) => {
    isInitialLoad.current = false; // User action, allow save
    setParams({ currency: currency || null });
  };

  const updateDateRange = (from: string, to: string) => {
    isInitialLoad.current = false; // User action, allow save
    setParams({
      from,
      to,
      period: "custom",
    });
  };

  return {
    period: effectivePeriod,
    revenueType: effectiveRevenueType,
    currency: effectiveCurrency,
    from: dateRange.from,
    to: dateRange.to,
    fiscalYearStartMonth,
    isReady,
    updatePeriod,
    updateRevenueType,
    updateCurrency,
    updateDateRange,
  };
}
