"use client";

import { useQueryStates } from "nuqs";
import { parseAsString } from "nuqs/server";
import { useEffect, useMemo } from "react";
import { useTeamQuery } from "@/hooks/use-team";
import { useMetricsFilterStore } from "@/store/metrics-filter";
import {
  getPeriodDateRange,
  type PeriodOption,
} from "@/utils/metrics-date-utils";

// Default values for metrics filters
const DEFAULT_PERIOD: PeriodOption = "1-year";
const DEFAULT_REVENUE_TYPE = "net" as const;

export const metricsFilterSchema = {
  period: parseAsString.withDefault(DEFAULT_PERIOD),
  revenueType: parseAsString.withDefault(DEFAULT_REVENUE_TYPE),
  currency: parseAsString,
  from: parseAsString,
  to: parseAsString,
};

/**
 * Type guard to check if a string is a valid PeriodOption
 */
function isPeriodOption(
  value: string | null | undefined,
): value is PeriodOption {
  if (!value) return false;
  const validPeriods: PeriodOption[] = [
    "3-months",
    "6-months",
    "1-year",
    "2-years",
    "5-years",
    "fiscal-year",
    "custom",
  ];
  return validPeriods.includes(value as PeriodOption);
}

/**
 * Type guard to check if a string is a valid RevenueType
 */
function isRevenueType(
  value: string | null | undefined,
): value is "gross" | "net" {
  return value === "gross" || value === "net";
}

/**
 * Helper function to determine effective value with URL/localStorage precedence
 * - If store is not ready, use URL param or default
 * - If URL is not at defaults and has a value, use URL param
 * - Otherwise, use store (localStorage) value
 */
function getEffectiveValue<T extends string>(
  storeIsReady: boolean,
  isAtDefaults: boolean,
  urlValue: string | null | undefined,
  storeValue: T,
  defaultValue: T,
  typeGuard?: (value: string | null | undefined) => value is T,
): T {
  if (!storeIsReady) {
    if (urlValue && typeGuard?.(urlValue)) {
      return urlValue as T;
    }
    return defaultValue;
  }
  if (!isAtDefaults && urlValue && typeGuard?.(urlValue)) {
    return urlValue as T;
  }
  return storeValue;
}

export function useMetricsFilter() {
  const { data: team } = useTeamQuery();
  const fiscalYearStartMonth = team?.fiscalYearStartMonth;

  // Get store state and actions
  const store = useMetricsFilterStore();
  const {
    period: storePeriod,
    revenueType: storeRevenueType,
    currency: storeCurrency,
    customFrom,
    customTo,
    isReady: storeIsReady,
    setPeriod,
    setRevenueType,
    setCurrency,
    setDateRange,
    setFiscalYearStartMonth,
    initialize,
    syncFromUrl,
  } = store;

  // Sync with URL params
  const [params, setParams] = useQueryStates(metricsFilterSchema, {
    clearOnDefault: true,
  });

  // Initialize store when team changes
  useEffect(() => {
    if (!team?.id) return;
    initialize(team.id, fiscalYearStartMonth);
  }, [team?.id, fiscalYearStartMonth, initialize]);

  // Update fiscal year start month when it changes
  useEffect(() => {
    if (fiscalYearStartMonth !== undefined) {
      setFiscalYearStartMonth(fiscalYearStartMonth);
    }
  }, [fiscalYearStartMonth, setFiscalYearStartMonth]);

  /**
   * Determine if URL is at defaults (no explicit filter values)
   * When at defaults, localStorage values are used instead of URL params
   */
  const isAtDefaults = useMemo(() => {
    return (
      params.period === DEFAULT_PERIOD &&
      params.revenueType === DEFAULT_REVENUE_TYPE &&
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

  /**
   * Determine effective values (URL params take precedence, otherwise use store/localStorage)
   * These values are used throughout the app for filtering metrics
   */
  const effectivePeriod = useMemo(() => {
    return getEffectiveValue(
      storeIsReady,
      isAtDefaults,
      params.period,
      storePeriod,
      DEFAULT_PERIOD,
      isPeriodOption,
    );
  }, [params.period, isAtDefaults, storePeriod, storeIsReady]);

  const effectiveRevenueType = useMemo(() => {
    return getEffectiveValue(
      storeIsReady,
      isAtDefaults,
      params.revenueType,
      storeRevenueType,
      DEFAULT_REVENUE_TYPE,
      isRevenueType,
    );
  }, [params.revenueType, isAtDefaults, storeRevenueType, storeIsReady]);

  const effectiveCurrency = useMemo(() => {
    if (!storeIsReady) {
      return params.currency || null;
    }
    if (!isAtDefaults && params.currency !== undefined) {
      return params.currency || null;
    }
    return storeCurrency;
  }, [params.currency, isAtDefaults, storeCurrency, storeIsReady]);

  /**
   * Calculate from/to dates based on effective period
   * Priority: URL explicit dates > stored custom dates > calculated from period
   */
  const dateRange = useMemo(() => {
    // If URL has explicit from/to, use them
    if (params.from && params.to) {
      return { from: params.from, to: params.to };
    }

    // If period is custom and we have stored custom dates, use them
    if (effectivePeriod === "custom" && customFrom && customTo) {
      return { from: customFrom, to: customTo };
    }

    // Otherwise, calculate from period
    return getPeriodDateRange(
      effectivePeriod,
      fiscalYearStartMonth,
      customFrom,
      customTo,
    );
  }, [
    effectivePeriod,
    customFrom,
    customTo,
    params.from,
    params.to,
    fiscalYearStartMonth,
  ]);

  /**
   * Sync URL params to store when they change (but not when URL is at defaults)
   * When URL is at defaults, localStorage values are used instead
   */
  useEffect(() => {
    if (!storeIsReady) return;
    if (isAtDefaults) return; // Don't sync if URL is at defaults (use localStorage values instead)

    syncFromUrl(
      params.period,
      params.revenueType,
      params.currency,
      params.from,
      params.to,
    );
  }, [
    params.period,
    params.revenueType,
    params.currency,
    params.from,
    params.to,
    storeIsReady,
    isAtDefaults,
    syncFromUrl,
  ]);

  /**
   * Resolved currency for API calls
   * - If effectiveCurrency is set (string), use it
   * - Otherwise, fall back to team's base currency
   * This is always a string (never null) for API compatibility
   */
  const resolvedCurrency = useMemo(() => {
    if (effectiveCurrency && typeof effectiveCurrency === "string") {
      return effectiveCurrency;
    }
    return team?.baseCurrency ?? undefined;
  }, [effectiveCurrency, team?.baseCurrency]);

  /**
   * Update functions that sync both store (localStorage) and URL
   * These functions ensure both persistence mechanisms stay in sync
   */

  /**
   * Update the period filter
   * Calculates and sets the date range based on the selected period
   */
  const updatePeriod = (period: PeriodOption) => {
    setPeriod(period);

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

  /**
   * Update the revenue type filter (gross or net)
   */
  const updateRevenueType = (revenueType: "gross" | "net") => {
    setRevenueType(revenueType);
    setParams({ revenueType });
  };

  /**
   * Update the currency filter
   * - null = base currency (removes param from URL)
   * - string = specific currency (adds param to URL)
   */
  const updateCurrency = (currency: string | null) => {
    setCurrency(currency);
    // When base currency is selected (null), remove the param from URL
    // When a specific currency is selected, set it in the URL
    if (currency === null) {
      // Explicitly set to null to clear the currency param from URL
      setParams({ currency: null });
    } else {
      setParams({ currency });
    }
  };

  /**
   * Update the custom date range
   * Automatically sets period to "custom" when dates are manually selected
   */
  const updateDateRange = (from: string, to: string) => {
    setDateRange(from, to);
    setParams({
      from,
      to,
      period: "custom",
    });
  };

  return {
    period: effectivePeriod,
    revenueType: effectiveRevenueType,
    currency: resolvedCurrency, // Resolved currency (not null) - for API calls
    effectiveCurrency, // Raw effective currency (can be null) - for UI state
    from: dateRange.from,
    to: dateRange.to,
    fiscalYearStartMonth,
    updatePeriod,
    updateRevenueType,
    updateCurrency,
    updateDateRange,
  };
}
