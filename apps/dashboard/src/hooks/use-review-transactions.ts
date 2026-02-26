import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useSortParams } from "@/hooks/use-sort-params";
import { useTRPC } from "@/trpc/client";

/**
 * Hook to fetch the full review queue (fulfilled but not exported).
 * Review intentionally ignores user filters so the queue can reliably reach zero.
 */
export function useReviewTransactions() {
  const trpc = useTRPC();
  const { params } = useSortParams();

  const query = useInfiniteQuery(
    trpc.transactions.get.infiniteQueryOptions(
      {
        // Review is a strict queue and does not apply user filters.
        sort: params.sort,
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
