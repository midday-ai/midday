"use client";

import { VirtualRow } from "@/components/tables/core";
import { useReconciliationFilterParams } from "@/hooks/use-reconciliation-filter-params";
import { useReconciliationParams } from "@/hooks/use-reconciliation-params";
import { useRealtime } from "@/hooks/use-realtime";
import { useScrollHeader } from "@/hooks/use-scroll-header";
import { useUserQuery } from "@/hooks/use-user";
import { useReconciliationStore } from "@/store/reconciliation";
import { useTRPC } from "@/trpc/client";
import { Table, TableBody } from "@midday/ui/table";
import { TooltipProvider } from "@midday/ui/tooltip";
import { toast } from "@midday/ui/use-toast";
import {
  useMutation,
  useQueryClient,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useCallback,
  useDeferredValue,
  useMemo,
  useRef,
} from "react";
import { useDebounceCallback } from "usehooks-ts";
import { columns } from "./columns";
import { DataTableHeader } from "./data-table-header";
import { NoReconciliationData, NoResults } from "./empty-states";

const ROW_HEIGHT = 45;
const OVERSCAN = 10;

export function DataTable() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: user } = useUserQuery();
  const { filter, hasFilters } = useReconciliationFilterParams();
  const { transactionId, setTransactionId } = useReconciliationParams();
  const { selectedTransactionIds, setSelectedTransactionIds, clearSelection } =
    useReconciliationStore();
  const parentRef = useRef<HTMLDivElement>(null);
  const deferredSearch = useDeferredValue(filter.q);

  useScrollHeader(parentRef);

  const queryFilter = useMemo(
    () => ({
      teamId: user?.teamId ?? "",
      matchStatus: filter.matchStatus ?? undefined,
      q: deferredSearch ?? undefined,
      start: filter.start ?? undefined,
      end: filter.end ?? undefined,
      bankAccountIds: filter.accounts ?? undefined,
      dealIds: filter.deals ?? undefined,
      confidenceMin: filter.confidenceMin ?? undefined,
      pageSize: hasFilters ? 10000 : undefined,
    }),
    [filter, deferredSearch, user?.teamId, hasFilters],
  );

  const infiniteQueryOptions =
    trpc.reconciliation.getPaymentFeed.infiniteQueryOptions(queryFilter, {
      getNextPageParam: ({ meta }) => meta?.cursor,
    });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useSuspenseInfiniteQuery(infiniteQueryOptions);

  const debouncedRefetch = useDebounceCallback(() => {
    refetch();
    queryClient.invalidateQueries({
      queryKey: trpc.reconciliation.getStats.queryKey(),
    });
  }, 200);

  useRealtime({
    channelName: "realtime_reconciliation",
    table: "transactions",
    filter: user?.teamId ? `team_id=eq.${user.teamId}` : undefined,
    onEvent: (payload) => {
      if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        debouncedRefetch();
      }
    },
  });

  const allRows = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  // Row selection mapped to tanstack table format
  const rowSelection = useMemo(() => {
    const selection: Record<string, boolean> = {};
    for (const id of selectedTransactionIds) {
      const idx = allRows.findIndex((r) => r.id === id);
      if (idx >= 0) selection[String(idx)] = true;
    }
    return selection;
  }, [selectedTransactionIds, allRows]);

  const table = useReactTable({
    data: allRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    state: { rowSelection },
    onRowSelectionChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(rowSelection) : updater;
      const ids = Object.keys(next)
        .filter((k) => next[k])
        .map((k) => allRows[Number(k)]?.id)
        .filter(Boolean) as string[];
      setSelectedTransactionIds(ids);
    },
  });

  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  // Infinite scroll
  const virtualItems = virtualizer.getVirtualItems();
  const lastItem = virtualItems[virtualItems.length - 1];
  if (
    lastItem &&
    lastItem.index >= rows.length - OVERSCAN &&
    hasNextPage &&
    !isFetchingNextPage
  ) {
    fetchNextPage();
  }

  const handleRowClick = useCallback(
    (id: string) => {
      setTransactionId(id);
    },
    [setTransactionId],
  );

  // Bulk actions
  const confirmMutation = useMutation(
    trpc.reconciliation.bulkConfirmMatches.mutationOptions({
      onSuccess: (result) => {
        clearSelection();
        debouncedRefetch();
        toast({
          title: `${result.confirmed} matches confirmed`,
          variant: "success",
        });
      },
    }),
  );

  if (allRows.length === 0) {
    return hasFilters ? <NoResults /> : <NoReconciliationData />;
  }

  return (
    <TooltipProvider>
      <div className="relative">
        {selectedTransactionIds.length > 0 && (
          <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-2 bg-muted border-b">
            <span className="text-sm text-muted-foreground">
              {selectedTransactionIds.length} selected
            </span>
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
              onClick={() => {
                confirmMutation.mutate({
                  start: filter.start ?? undefined,
                  end: filter.end ?? undefined,
                });
              }}
            >
              Confirm All Suggested
            </button>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:underline"
              onClick={clearSelection}
            >
              Clear
            </button>
          </div>
        )}

        <div
          ref={parentRef}
          className="overflow-auto"
          style={{ height: "calc(100vh - 220px)" }}
        >
          <Table>
            <DataTableHeader table={table} />
            <TableBody>
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ height: virtualizer.getTotalSize(), padding: 0 }}
                >
                  <div style={{ position: "relative", width: "100%" }}>
                    {virtualItems.map((virtualRow) => {
                      const row = rows[virtualRow.index];
                      if (!row) return null;

                      return (
                        <VirtualRow
                          key={row.id}
                          row={row}
                          virtualRow={virtualRow}
                          onClick={() => handleRowClick(row.original.id)}
                        />
                      );
                    })}
                  </div>
                </td>
              </tr>
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
}
