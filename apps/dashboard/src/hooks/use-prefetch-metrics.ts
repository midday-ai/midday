"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useTRPC } from "@/trpc/client";

/**
 * Prefetches metrics data in the background after initial page load.
 * Delays to avoid batching with initial tRPC requests.
 * Uses the exact same filter values as MetricsView to ensure cache hits.
 */
export function usePrefetchMetrics() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { from, to, currency, revenueType } = useMetricsFilter();
  const hasPrefetched = useRef(false);

  useEffect(() => {
    if (hasPrefetched.current) return;

    const prefetchMetrics = () => {
      hasPrefetched.current = true;

      // Prefetch all metrics queries with exact same options as cards use
      Promise.all([
        queryClient.prefetchQuery(
          trpc.reports.revenue.queryOptions({
            from,
            to,
            currency,
            revenueType,
          }),
        ),
        queryClient.prefetchQuery(
          trpc.reports.expense.queryOptions({ from, to, currency }),
        ),
        queryClient.prefetchQuery(
          trpc.reports.profit.queryOptions({ from, to, currency, revenueType }),
        ),
        queryClient.prefetchQuery(
          trpc.reports.burnRate.queryOptions({ from, to, currency }),
        ),
        queryClient.prefetchQuery(
          trpc.reports.runway.queryOptions({ currency }),
        ),
        queryClient.prefetchQuery(
          trpc.reports.spending.queryOptions({ from, to, currency }),
        ),
        queryClient.prefetchQuery(
          trpc.reports.revenueForecast.queryOptions({
            from,
            to,
            forecastMonths: 6,
            currency,
            revenueType,
          }),
        ),
        queryClient.prefetchQuery(
          trpc.widgets.getAccountBalances.queryOptions({ currency }),
        ),
      ]);
    };

    // Wait 1s to avoid batching with initial tRPC requests
    const timeoutId = setTimeout(prefetchMetrics, 1000);

    return () => clearTimeout(timeoutId);
  }, [queryClient, trpc, from, to, currency, revenueType]);
}
