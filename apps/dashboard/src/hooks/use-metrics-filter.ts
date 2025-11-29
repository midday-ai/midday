"use client";

import { useTeamQuery } from "@/hooks/use-team";
import { useMetricsFilterStore } from "@/store/metrics-filter";
import {
  type PeriodOption,
  getPeriodDateRange,
} from "@/utils/metrics-date-utils";
import { useQueryStates } from "nuqs";
import { parseAsString } from "nuqs/server";
import { useEffect, useMemo } from "react";

export const metricsFilterSchema = {
  period: parseAsString.withDefault("1-year"),
  revenueType: parseAsString.withDefault("net"),
  currency: parseAsString,
  from: parseAsString,
  to: parseAsString,
};

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

  // Determine if URL is at defaults
  const isAtDefaults = useMemo(() => {
    const defaultPeriod = "1-year";
    const defaultRevenueType = "net";
    return (
      params.period === defaultPeriod &&
      params.revenueType === defaultRevenueType &&
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

  // Determine effective values (URL params take precedence, otherwise use store)
  const effectivePeriod = useMemo(() => {
    if (!storeIsReady) {
      return (params.period as PeriodOption) || "1-year";
    }
    if (!isAtDefaults && params.period) {
      return params.period as PeriodOption;
    }
    return storePeriod;
  }, [params.period, isAtDefaults, storePeriod, storeIsReady]);

  const effectiveRevenueType = useMemo(() => {
    if (!storeIsReady) {
      return (params.revenueType as "gross" | "net") || "net";
    }
    if (!isAtDefaults && params.revenueType) {
      return params.revenueType as "gross" | "net";
    }
    return storeRevenueType;
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

  // Calculate from/to dates based on effective period
  const dateRange = useMemo(() => {
    // If URL has explicit from/to, use them
    if (params.from && params.to) {
      return { from: params.from, to: params.to };
    }

    // Otherwise, calculate from effective period (or stored custom dates)
    const periodToUse = effectivePeriod;

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
    customFrom,
    customTo,
    params.from,
    params.to,
    fiscalYearStartMonth,
  ]);

  // Sync URL params to store when they change (but not when URL is at defaults)
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

  // Resolve currency: if null or undefined, use team base currency
  const resolvedCurrency = useMemo(() => {
    // If effectiveCurrency is a string, use it
    // If effectiveCurrency is null or undefined, use team base currency
    if (effectiveCurrency && typeof effectiveCurrency === "string") {
      return effectiveCurrency;
    }
    return team?.baseCurrency ?? undefined;
  }, [effectiveCurrency, team?.baseCurrency]);

  // Update functions that sync both store and URL
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

  const updateRevenueType = (revenueType: "gross" | "net") => {
    setRevenueType(revenueType);
    setParams({ revenueType });
  };

  const updateCurrency = (currency: string | null) => {
    setCurrency(currency);
    // When base currency is selected (null), remove the param from URL
    // When a specific currency is selected, set it in the URL
    if (currency === null) {
      // Remove currency param - use callback form to explicitly remove it
      setParams((prev) => {
        const { currency: _, ...rest } = prev;
        return rest;
      });
    } else {
      setParams({ currency });
    }
  };

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
    isReady: storeIsReady,
    updatePeriod,
    updateRevenueType,
    updateCurrency,
    updateDateRange,
  };
}
