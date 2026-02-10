"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useInvalidateTransactionQueries() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return () => {
    // Invalidate transaction queries
    queryClient.invalidateQueries({
      queryKey: trpc.transactions.get.infiniteQueryKey(),
    });

    queryClient.invalidateQueries({
      queryKey: trpc.transactions.getById.queryKey(),
    });

    // Invalidate reports queries
    queryClient.invalidateQueries({
      queryKey: trpc.reports.revenue.queryKey(),
    });

    queryClient.invalidateQueries({
      queryKey: trpc.reports.profit.queryKey(),
    });

    queryClient.invalidateQueries({
      queryKey: trpc.reports.expense.queryKey(),
    });

    queryClient.invalidateQueries({
      queryKey: trpc.reports.spending.queryKey(),
    });

    queryClient.invalidateQueries({
      queryKey: trpc.reports.taxSummary.queryKey(),
    });

    queryClient.invalidateQueries({
      queryKey: trpc.reports.revenueForecast.queryKey(),
    });

    // Invalidate widgets queries
    queryClient.invalidateQueries({
      queryKey: trpc.widgets.getRevenueSummary.queryKey(),
    });

    queryClient.invalidateQueries({
      queryKey: trpc.widgets.getProfitMargin.queryKey(),
    });

    queryClient.invalidateQueries({
      queryKey: trpc.widgets.getCategoryExpenses.queryKey(),
    });

    queryClient.invalidateQueries({
      queryKey: trpc.widgets.getTaxSummary.queryKey(),
    });

    queryClient.invalidateQueries({
      queryKey: trpc.widgets.getCashFlow.queryKey(),
    });

    queryClient.invalidateQueries({
      queryKey: trpc.widgets.getMonthlySpending.queryKey(),
    });

    queryClient.invalidateQueries({
      queryKey: trpc.widgets.getRecurringExpenses.queryKey(),
    });

    // Invalidate global search
    queryClient.invalidateQueries({
      queryKey: trpc.search.global.queryKey(),
    });
  };
}
