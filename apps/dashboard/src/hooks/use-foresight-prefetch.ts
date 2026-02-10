"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { useForesight } from "@/hooks/use-foresight";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useTRPC } from "@/trpc/client";

/**
 * Hook for predictive data prefetching using ForesightJS.
 * Prefetches data when cursor trajectory indicates user is heading toward an element.
 */

// Module-level constants to avoid creating new object references on each render
// (useForesight includes hitSlop in its dependency array)
const METRICS_HIT_SLOP = { top: 100, right: 100, bottom: 100, left: 100 };
const CHAT_HIT_SLOP = { top: 150, right: 150, bottom: 150, left: 150 };
const SEARCH_HIT_SLOP = { top: 100, right: 100, bottom: 100, left: 100 };

/**
 * Prefetch metrics data when cursor heads toward Metrics tab
 */
export function useForesightMetricsPrefetch() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { from, to, currency, revenueType } = useMetricsFilter();
  const hasPrefetched = useRef(false);

  const prefetchMetrics = useCallback(() => {
    if (hasPrefetched.current) return;
    hasPrefetched.current = true;

    // Prefetch all metrics queries
    Promise.all([
      queryClient.prefetchQuery(
        trpc.reports.revenue.queryOptions({ from, to, currency, revenueType }),
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
      queryClient.prefetchQuery(trpc.reports.runway.queryOptions({ currency })),
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
  }, [queryClient, trpc, from, to, currency, revenueType]);

  const { elementRef } = useForesight<HTMLButtonElement>({
    callback: prefetchMetrics,
    name: "metrics-tab",
    hitSlop: METRICS_HIT_SLOP,
  });

  return { elementRef, prefetchMetrics };
}

/**
 * Prefetch chat history when cursor heads toward chat input area
 */
export function useForesightChatPrefetch() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const hasPrefetched = useRef(false);

  const prefetchChatData = useCallback(() => {
    if (hasPrefetched.current) return;
    hasPrefetched.current = true;

    // Prefetch chat history - must match ChatHistoryDropdown query params exactly
    queryClient.prefetchQuery(
      trpc.chats.list.queryOptions({
        limit: 20,
        search: undefined,
      }),
    );
  }, [queryClient, trpc]);

  const { elementRef } = useForesight<HTMLButtonElement>({
    callback: prefetchChatData,
    name: "chat-input",
    hitSlop: CHAT_HIT_SLOP,
  });

  return { elementRef, prefetchChatData };
}

/**
 * Prefetch search data when cursor heads toward search button
 */
export function useForesightSearchPrefetch() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const hasPrefetched = useRef(false);

  const prefetchSearchData = useCallback(() => {
    if (hasPrefetched.current) return;
    hasPrefetched.current = true;

    // Prefetch global search with empty query to warm up the cache
    queryClient.prefetchQuery(
      trpc.search.global.queryOptions({
        searchTerm: "",
      }),
    );
  }, [queryClient, trpc]);

  const { elementRef } = useForesight<HTMLButtonElement>({
    callback: prefetchSearchData,
    name: "search-button",
    hitSlop: SEARCH_HIT_SLOP,
  });

  return { elementRef, prefetchSearchData };
}
