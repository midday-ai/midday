"use client";

import type { PeriodOption } from "@/utils/metrics-date-utils";
import { create } from "zustand";

const STORAGE_KEY_BASE = "analytics-filter-preferences";

const getStorageKey = (teamId: string | undefined): string => {
  if (!teamId) return STORAGE_KEY_BASE;
  return `${STORAGE_KEY_BASE}-${teamId}`;
};

type RevenueType = "gross" | "net";

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

    setPeriod: (period) => {
      const state = get();
      set({ period });
      // Save to localStorage
      const prefs: StoredPreferences = {
        period,
        revenueType: state.revenueType,
        currency: state.currency,
        customFrom: state.customFrom,
        customTo: state.customTo,
      };
      savePreferences(prefs, state.teamId);
    },

    setRevenueType: (revenueType) => {
      const state = get();
      set({ revenueType });
      // Save to localStorage
      const prefs: StoredPreferences = {
        period: state.period,
        revenueType,
        currency: state.currency,
        customFrom: state.customFrom,
        customTo: state.customTo,
      };
      savePreferences(prefs, state.teamId);
    },

    setCurrency: (currency) => {
      const state = get();
      set({ currency });
      // Save to localStorage
      const prefs: StoredPreferences = {
        period: state.period,
        revenueType: state.revenueType,
        currency,
        customFrom: state.customFrom,
        customTo: state.customTo,
      };
      savePreferences(prefs, state.teamId);
    },

    setDateRange: (from, to) => {
      const state = get();
      set({
        from,
        to,
        period: "custom" as PeriodOption,
        customFrom: from,
        customTo: to,
      });
      // Save to localStorage
      const prefs: StoredPreferences = {
        period: "custom",
        revenueType: state.revenueType,
        currency: state.currency,
        customFrom: from,
        customTo: to,
      };
      savePreferences(prefs, state.teamId);
    },

    setFiscalYearStartMonth: (month) => {
      set({ fiscalYearStartMonth: month });
    },

    initialize: (teamId, fiscalYearStartMonth) => {
      set({
        teamId,
        fiscalYearStartMonth,
        isReady: false,
      });
      get().loadFromStorage(teamId);
    },

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

    syncFromUrl: (
      period?: string | null,
      revenueType?: string | null,
      currency?: string | null,
      from?: string | null,
      to?: string | null,
    ) => {
      const state = get();
      const updates: Partial<MetricsFilterState> = {};

      if (period) {
        updates.period = period as PeriodOption;
      }
      if (revenueType) {
        updates.revenueType = revenueType as RevenueType;
      }
      if (currency !== undefined) {
        updates.currency = currency ?? null;
      }
      if (from && to) {
        updates.from = from;
        updates.to = to;
        updates.customFrom = from;
        updates.customTo = to;
      }

      if (Object.keys(updates).length > 0) {
        set(updates);
        // Save to localStorage if we have teamId
        if (state.teamId) {
          const prefs: StoredPreferences = {
            period: (updates.period ?? state.period) as PeriodOption,
            revenueType: (updates.revenueType ??
              state.revenueType) as RevenueType,
            currency: updates.currency ?? state.currency,
            customFrom: updates.customFrom ?? state.customFrom,
            customTo: updates.customTo ?? state.customTo,
          };
          savePreferences(prefs, state.teamId);
        }
      }
    },
  }),
);
