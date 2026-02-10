"use client";

import { create } from "zustand";
import type { PeriodOption } from "@/utils/metrics-date-utils";

const STORAGE_KEY_BASE = "metrics-filter-preferences";

const getStorageKey = (teamId: string | undefined): string => {
  if (!teamId) return STORAGE_KEY_BASE;
  return `${STORAGE_KEY_BASE}-${teamId}`;
};

type RevenueType = "gross" | "net";

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
function isRevenueType(value: string | null | undefined): value is RevenueType {
  return value === "gross" || value === "net";
}

interface StoredPreferences {
  period: PeriodOption;
  revenueType: RevenueType;
  currency: string | null;
  customFrom?: string;
  customTo?: string;
}

const getStoredPreferences = (
  teamId: string | undefined,
): StoredPreferences | null => {
  if (typeof window === "undefined") return null;
  try {
    const storageKey = getStorageKey(teamId);
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const savePreferences = (
  prefs: StoredPreferences,
  teamId: string | undefined,
) => {
  if (typeof window === "undefined") return;
  try {
    const storageKey = getStorageKey(teamId);
    localStorage.setItem(storageKey, JSON.stringify(prefs));
  } catch {
    // Ignore errors
  }
};

/**
 * Helper function to save current preferences to localStorage
 * Extracts the current state and saves it, reducing code duplication
 */
const saveCurrentPreferences = (state: MetricsFilterState): void => {
  if (!state.teamId) return;
  const prefs: StoredPreferences = {
    period: state.period,
    revenueType: state.revenueType,
    currency: state.currency,
    customFrom: state.customFrom,
    customTo: state.customTo,
  };
  savePreferences(prefs, state.teamId);
};

interface MetricsFilterState {
  // Internal state
  period: PeriodOption;
  revenueType: RevenueType;
  currency: string | null; // null = base currency
  customFrom?: string;
  customTo?: string;
  isReady: boolean;
  teamId?: string;
  fiscalYearStartMonth?: number | null;

  // Computed values (will be calculated in hook)
  from: string;
  to: string;

  // Actions
  setPeriod: (period: PeriodOption) => void;
  setRevenueType: (revenueType: RevenueType) => void;
  setCurrency: (currency: string | null) => void;
  setDateRange: (from: string, to: string) => void;
  setFiscalYearStartMonth: (month?: number | null) => void;
  initialize: (teamId: string, fiscalYearStartMonth?: number | null) => void;
  loadFromStorage: (teamId: string) => void;
  syncFromUrl: (
    period?: string | null,
    revenueType?: string | null,
    currency?: string | null,
    from?: string | null,
    to?: string | null,
  ) => void;
}

export const useMetricsFilterStore = create<MetricsFilterState>()(
  (set, get) => ({
    // Initial state
    period: "1-year",
    revenueType: "net",
    currency: null,
    isReady: false,
    from: "",
    to: "",

    /**
     * Update the period filter and save to localStorage
     */
    setPeriod: (period) => {
      set((state) => {
        saveCurrentPreferences({ ...state, period });
        return { period };
      });
    },

    /**
     * Update the revenue type filter and save to localStorage
     */
    setRevenueType: (revenueType) => {
      set((state) => {
        saveCurrentPreferences({ ...state, revenueType });
        return { revenueType };
      });
    },

    /**
     * Update the currency filter and save to localStorage
     * null = base currency, string = specific currency
     */
    setCurrency: (currency) => {
      set((state) => {
        saveCurrentPreferences({ ...state, currency });
        return { currency };
      });
    },

    /**
     * Update the custom date range and save to localStorage
     * Automatically sets period to "custom"
     */
    setDateRange: (from, to) => {
      set((state) => {
        const updates = {
          from,
          to,
          period: "custom" as PeriodOption,
          customFrom: from,
          customTo: to,
        };
        saveCurrentPreferences({ ...state, ...updates });
        return updates;
      });
    },

    /**
     * Update the fiscal year start month
     */
    setFiscalYearStartMonth: (month) => {
      set({ fiscalYearStartMonth: month });
    },

    /**
     * Initialize the store with team ID and fiscal year settings
     * Loads preferences from localStorage
     */
    initialize: (teamId, fiscalYearStartMonth) => {
      set({
        teamId,
        fiscalYearStartMonth,
        isReady: false,
      });
      get().loadFromStorage(teamId);
    },

    /**
     * Load preferences from localStorage for the given team
     */
    loadFromStorage: (teamId) => {
      const stored = getStoredPreferences(teamId);
      if (stored) {
        set({
          period: stored.period,
          revenueType: stored.revenueType,
          currency: stored.currency,
          customFrom: stored.customFrom,
          customTo: stored.customTo,
        });
      }
      set({ isReady: true });
    },

    /**
     * Sync URL parameters to store state
     * Only updates fields that are provided and valid
     * Saves updated preferences to localStorage
     */
    syncFromUrl: (
      period?: string | null,
      revenueType?: string | null,
      currency?: string | null,
      from?: string | null,
      to?: string | null,
    ) => {
      const state = get();
      const updates: Partial<MetricsFilterState> = {};

      // Validate and set period if provided
      if (period && isPeriodOption(period)) {
        updates.period = period;
      }

      // Validate and set revenue type if provided
      if (revenueType && isRevenueType(revenueType)) {
        updates.revenueType = revenueType;
      }

      // Set currency if provided (can be null for base currency)
      if (currency !== undefined) {
        updates.currency = currency ?? null;
      }

      // Set custom date range if both dates are provided
      if (from && to) {
        updates.from = from;
        updates.to = to;
        updates.customFrom = from;
        updates.customTo = to;
      }

      // Apply updates and save to localStorage
      if (Object.keys(updates).length > 0) {
        set(updates);
        saveCurrentPreferences({ ...state, ...updates });
      }
    },
  }),
);
