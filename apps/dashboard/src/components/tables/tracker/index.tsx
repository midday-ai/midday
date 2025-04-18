"use client";

import { LoadMore } from "@/components/load-more";
import { useLatestProjectId } from "@/hooks/use-latest-project-id";
import { useSortParams } from "@/hooks/use-sort-params";
import { useTrackerFilterParams } from "@/hooks/use-tracker-filter-params";
import { useTRPC } from "@/trpc/client";
import { Table, TableBody } from "@midday/ui/table";
import { useMutation, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useDeferredValue, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { DataTableHeader } from "./data-table-header";
import { DataTableRow } from "./data-table-row";
import { EmptyState, NoResults } from "./empty-states";

export function DataTable() {
  const trpc = useTRPC();
  const { ref, inView } = useInView();
  const { latestProjectId, setLatestProjectId } = useLatestProjectId();
  const { params } = useSortParams();
  const { hasFilters, filter } = useTrackerFilterParams();
  const deferredSearch = useDeferredValue(filter.q);

  const infiniteQueryOptions = trpc.trackerProjects.get.infiniteQueryOptions(
    {
      filter: {
        ...filter,
        q: deferredSearch ?? null,
      },
      sort: params.sort,
    },
    {
      getNextPageParam: ({ meta }) => meta?.cursor,
    },
  );

  const { data, fetchNextPage, hasNextPage, refetch, isFetching } =
    useSuspenseInfiniteQuery(infiniteQueryOptions);

  const deleteTrackerProjectMutation = useMutation(
    trpc.trackerProjects.delete.mutationOptions({
      onSuccess: (result) => {
        if (result && result.id === latestProjectId) {
          setLatestProjectId(null);
        }

        refetch();
      },
    }),
  );

  const pageData = data?.pages.flatMap((page) => page.data);

  useEffect(() => {
    if (inView) {
      fetchNextPage();
    }
  }, [inView]);

  if (!isFetching && !pageData?.length && !hasFilters) {
    return <EmptyState />;
  }

  if (!pageData?.length && hasFilters) {
    return <NoResults />;
  }

  return (
    <>
      <Table>
        <DataTableHeader />

        <TableBody>
          {pageData?.map((row) => (
            <DataTableRow
              row={row}
              key={row.id}
              onDelete={deleteTrackerProjectMutation.mutate}
            />
          ))}
        </TableBody>
      </Table>

      <LoadMore ref={ref} hasNextPage={hasNextPage} />
    </>
  );
}
