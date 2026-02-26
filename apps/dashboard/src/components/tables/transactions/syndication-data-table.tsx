"use client";

import { VirtualRow } from "@/components/tables/core";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useTransactionsStore } from "@/store/transactions";
import { useTRPC } from "@/trpc/client";
import { cn } from "@midday/ui/cn";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useMemo, useRef } from "react";
import { NoSyndicationTransactions } from "./empty-states";
import { syndicationColumns } from "./syndication-columns";
import type { RouterOutputs } from "@api/trpc/routers/_app";

export type SyndicationTransaction =
  RouterOutputs["syndication"]["getTeamTransactions"]["data"][number];

const NON_CLICKABLE_COLUMNS = new Set(["select"]);

// Simple no-op sticky style since this table doesn't need horizontal scroll management
const emptyStickyStyle = () => ({});
const baseStickyClassName = (_columnId: string, baseClassName?: string) =>
  baseClassName ?? "";

export function SyndicationDataTable() {
  const trpc = useTRPC();
  const parentRef = useRef<HTMLDivElement>(null);
  const { rowSelectionByTab, setRowSelection: setRowSelectionForTab } =
    useTransactionsStore();

  const rowSelection = rowSelectionByTab.syndication;
  const setRowSelection = useCallback(
    (updater: Parameters<typeof setRowSelectionForTab>[1]) => {
      setRowSelectionForTab("syndication", updater);
    },
    [setRowSelectionForTab],
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      trpc.syndication.getTeamTransactions.infiniteQueryOptions(
        {},
        { getNextPageParam: ({ meta }) => meta?.cursor },
      ),
    );

  const tableData = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  const table = useReactTable({
    getRowId: (row) => row.id,
    data: tableData,
    columns: syndicationColumns as ColumnDef<SyndicationTransaction, unknown>[],
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
  });

  const rows = table.getRowModel().rows;

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 10,
  });

  useInfiniteScroll<HTMLDivElement>({
    scrollRef: parentRef,
    rowVirtualizer,
    rowCount: rows.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    threshold: 20,
  });

  if (!tableData.length) {
    return (
      <div className="relative h-[calc(100vh-200px)] overflow-hidden">
        <NoSyndicationTransactions />
      </div>
    );
  }

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className="relative">
      <div
        ref={parentRef}
        className="overflow-auto overscroll-none border-l border-r border-b border-border scrollbar-hide"
        style={{ height: "calc(100vh - 180px)" }}
      >
        <Table className="w-full min-w-full">
          <TableHeader className="border-0 block sticky top-0 z-20 bg-background w-full">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="flex items-center border-b border-border"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "h-9 flex items-center text-xs font-medium text-[#878787]",
                      header.column.id === "select" && "pl-3 pr-1",
                    )}
                    style={{ width: header.column.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : typeof header.column.columnDef.header === "function"
                        ? header.column.columnDef.header(header.getContext())
                        : header.column.columnDef.header}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody
            className="border-l-0 border-r-0 block"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: "relative",
            }}
          >
            {virtualItems.map((virtualItem) => {
              const row = rows[virtualItem.index];
              if (!row) return null;

              return (
                <VirtualRow
                  key={row.id}
                  row={row}
                  virtualStart={virtualItem.start}
                  rowHeight={52}
                  getStickyStyle={emptyStickyStyle}
                  getStickyClassName={baseStickyClassName}
                  nonClickableColumns={NON_CLICKABLE_COLUMNS}
                  isSelected={rowSelection[row.id] ?? false}
                />
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
