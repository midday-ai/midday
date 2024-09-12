"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

/**
 * Interface for financial analytics services
 */
interface FinancialAnalytics {
  merchantAnalytics: boolean;
  locationAnalytics: boolean;
  historicalAnalytics: boolean;
  categoryAnalytics: boolean;
  expenseAnalytics: boolean;
  incomeAnalytics: boolean;
}

/**
 * Default state for financial analytics (all false)
 */
const defaultAnalytics: FinancialAnalytics = {
  merchantAnalytics: false,
  locationAnalytics: false,
  historicalAnalytics: false,
  categoryAnalytics: false,
  expenseAnalytics: false,
  incomeAnalytics: false,
};

/**
 * Context to store the user's enabled financial analytics.
 */
const FinancialAnalyticsContext =
  createContext<FinancialAnalytics>(defaultAnalytics);

/**
 * Custom hook to access the financial analytics context.
 *
 * @returns {FinancialAnalytics} - The current enabled financial analytics for the user.
 */
export const useFinancialAnalytics = (): FinancialAnalytics =>
  useContext(FinancialAnalyticsContext);

/**
 * Provider component for managing user's enabled financial analytics.
 *
 * @param {Object} props - The properties object.
 * @param {React.ReactNode} props.children - The child components that will be wrapped by this provider.
 * @param {FinancialAnalytics} props.enabledAnalytics - The financial analytics enabled for the user.
 * @returns {JSX.Element} - The provider component wrapping the children with the financial analytics context.
 */
export function FinancialAnalyticsProvider({
  children,
  enabledAnalytics,
}: {
  children: React.ReactNode;
  enabledAnalytics: FinancialAnalytics;
}): JSX.Element {
  const [analytics, setAnalytics] =
    useState<FinancialAnalytics>(enabledAnalytics);

  useEffect(() => {
    setAnalytics(enabledAnalytics);
  }, [enabledAnalytics]);

  return (
    <FinancialAnalyticsContext.Provider value={analytics}>
      {children}
    </FinancialAnalyticsContext.Provider>
  );
}
