import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useSortParams } from "@/hooks/use-sort-params";
import { useTransactionFilterParamsWithPersistence } from "@/hooks/use-transaction-filter-params-with-persistence";
import { useTRPC } from "@/trpc/client";

/**
 * Hook to fetch review transactions (fulfilled but not exported) with user-applied filters.
 * Used by export-bar and export-transactions-modal to ensure export respects current filters.
 */
export function useReviewTransactions() {
  const trpc = useTRPC();
  const { filter } = useTransactionFilterParamsWithPersistence();
  const { params: sortParams } = useSortParams();

  const query = useInfiniteQuery(
    trpc.transactions.get.infiniteQueryOptions(
      {
        ...filter,
        amountRange: filter.amount_range ?? null,
        sort: sortParams.sort,
        fulfilled: true,
        exported: false,
        pageSize: 10000,
      },
      {
        getNextPageParam: ({ meta }) => meta?.cursor,
      },
    ),
  );

  const transactionIds = useMemo(() => {
    return (
      query.data?.pages.flatMap((page) => page.data.map((tx) => tx.id)) ?? []
    );
  }, [query.data]);

  return {
    ...query,
    transactionIds,
  };
}
