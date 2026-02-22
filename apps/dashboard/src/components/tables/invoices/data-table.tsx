"use client";

import { closestCenter, DndContext } from "@dnd-kit/core";
import { Table, TableBody } from "@midday/ui/table";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useVirtualizer, type VirtualItem } from "@tanstack/react-virtual";
import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { VirtualRow } from "@/components/tables/core";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useInvoiceFilterParams } from "@/hooks/use-invoice-filter-params";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useScrollHeader } from "@/hooks/use-scroll-header";
import { useSortParams } from "@/hooks/use-sort-params";
import { useStickyColumns } from "@/hooks/use-sticky-columns";
import { useTableDnd } from "@/hooks/use-table-dnd";
import { useTableScroll } from "@/hooks/use-table-scroll";
import { useTableSettings } from "@/hooks/use-table-settings";
import { useUserQuery } from "@/hooks/use-user";
import { useInvoiceStore } from "@/store/invoice";
import { useTRPC } from "@/trpc/client";
import { STICKY_COLUMNS, SUMMARY_GRID_HEIGHTS } from "@/utils/table-configs";
import { getColumnIds, type TableSettings } from "@/utils/table-settings";
import { BottomBar } from "./bottom-bar";
import { columns } from "./columns";
import { EmptyState, NoResults } from "./empty-states";
import { DataTableHeader } from "./table-header";

// Stable reference for non-clickable columns (avoids recreation on each render)
const NON_CLICKABLE_COLUMNS = new Set(["select", "actions"]);

const COLUMN_IDS = getColumnIds(columns);

type Props = {
  initialSettings?: Partial<TableSettings>;
};

export function DataTable({ initialSettings }: Props) {
  const trpc = useTRPC();
  const { params } = useSortParams();
  const { filter, hasFilters } = useInvoiceFilterParams();
  const { setParams } = useInvoiceParams();
  const { data: user } = useUserQuery();
  const parentRef = useRef<HTMLDivElement>(null);

  const { setColumns, setRowSelection, rowSelection } = useInvoiceStore();

  // Hide header and summary grid on scroll
  useScrollHeader(parentRef, { extraOffset: SUMMARY_GRID_HEIGHTS.invoices });

  // Use unified table settings hook for column state management
  const {
    columnVisibility,
    setColumnVisibility,
    columnSizing,
    setColumnSizing,
    columnOrder,
    setColumnOrder,
  } = useTableSettings({
    tableId: "invoices",
    initialSettings,
    columnIds: COLUMN_IDS,
  });

  const infiniteQueryOptions = trpc.invoice.get.infiniteQueryOptions(
    {
      sort: params.sort,
      ...filter,
    },
    {
      getNextPageParam: ({ meta }) => meta?.cursor,
    },
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(infiniteQueryOptions);

  const tableData = useMemo(() => {
    return data?.pages.flatMap((page) => page?.data ?? []) ?? [];
  }, [data]);

  // Memoize table meta
  const tableMeta = useMemo(
    () => ({
      dateFormat: user?.dateFormat,
      timeFormat: user?.timeFormat,
    }),
    [user?.dateFormat, user?.timeFormat],
  );

  const table = useReactTable({
    data: tableData,
    getRowId: ({ id }) => id,
    columns,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    // Column resizing
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: setColumnOrder,
    state: {
      columnVisibility,
      columnSizing,
      columnOrder,
      rowSelection,
    },
    meta: tableMeta,
  });

  // DnD for column reordering
  const { sensors, handleDragEnd } = useTableDnd(table);

  // Use the reusable sticky columns hook
  const { getStickyStyle, getStickyClassName } = useStickyColumns({
    columnVisibility,
    table,
    stickyColumns: STICKY_COLUMNS.invoices,
  });

  // Use the reusable table scroll hook
  const tableScroll = useTableScroll({
    useColumnWidths: true,
    startFromColumn: 2, // Skip sticky columns: select, invoiceNumber
  });

  const rows = table.getRowModel().rows;

  // Stable cell click handler for VirtualRow
  const handleCellClick = useCallback(
    (rowId: string) => {
      setParams({ invoiceId: rowId, type: "details" });
    },
    [setParams],
  );

  // Row virtualizer for performance
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 57, // Row height in pixels (matching original)
    overscan: 10,
  });

  // Trigger infinite load when scrolling near the bottom
  useInfiniteScroll<HTMLDivElement>({
    scrollRef: parentRef,
    rowVirtualizer,
    rowCount: rows.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  useEffect(() => {
    setColumns(table.getAllLeafColumns());
  }, [columnVisibility, setColumns, table]);

  const showBottomBar = Object.keys(rowSelection).length > 0;

  if (hasFilters && !tableData?.length) {
    return <NoResults />;
  }

  if (!tableData?.length) {
    return <EmptyState />;
  }

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className="relative">
      <div className="w-full">
        <div
          ref={(el) => {
            // Combine refs for both scroll container and virtualizer
            if (parentRef) {
              (
                parentRef as React.MutableRefObject<HTMLDivElement | null>
              ).current = el;
            }
            if (tableScroll.containerRef) {
              (
                tableScroll.containerRef as React.MutableRefObject<HTMLDivElement | null>
              ).current = el;
            }
          }}
          className="overflow-auto overscroll-contain border-l border-r border-b border-border scrollbar-hide"
          style={{
            height: "calc(100vh - 350px + var(--header-offset, 0px))",
          }}
        >
          <DndContext
            id="invoices-table-dnd"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table className="w-full min-w-full">
              <DataTableHeader table={table} tableScroll={tableScroll} />

              <TableBody
                className="border-l-0 border-r-0 block"
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  position: "relative",
                }}
              >
                {virtualItems.map((virtualRow: VirtualItem) => {
                  const row = rows[virtualRow.index];
                  if (!row) return null;

                  return (
                    <VirtualRow
                      key={row.id}
                      row={row}
                      virtualStart={virtualRow.start}
                      rowHeight={57}
                      getStickyStyle={getStickyStyle}
                      getStickyClassName={getStickyClassName}
                      nonClickableColumns={NON_CLICKABLE_COLUMNS}
                      onCellClick={handleCellClick}
                      columnSizing={columnSizing}
                      columnOrder={columnOrder}
                      columnVisibility={columnVisibility}
                      isSelected={rowSelection[row.id] ?? false}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </DndContext>
          {/* Spacer ensures scrolling works when content barely overflows */}
          <div
            style={{ height: "var(--header-offset, 0px)", flexShrink: 0 }}
            aria-hidden
          />
        </div>
      </div>

      <AnimatePresence>
        {showBottomBar && <BottomBar data={tableData} />}
      </AnimatePresence>
    </div>
  );
}
