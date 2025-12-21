"use client";

import { getCellStyle } from "@/components/tables/core";
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
import type { TableSettings } from "@/utils/table-settings";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { Checkbox } from "@midday/ui/checkbox";
import { Table, TableBody, TableCell, TableRow } from "@midday/ui/table";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { type VirtualItem, useVirtualizer } from "@tanstack/react-virtual";
import { AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import { BottomBar } from "./bottom-bar";
import { columns } from "./columns";
import { EmptyState, NoResults } from "./empty-states";
import { DataTableHeader } from "./table-header";

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
          className="overflow-auto overscroll-x-none md:border-l md:border-r md:border-b md:border-border scrollbar-hide"
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
                className="border-l-0 border-r-0"
                style={{
                  height: `${rowVirtualizer.getTotalSize() + 45}px`,
                  position: "relative",
                }}
              >
                {virtualItems.length > 0 ? (
                  virtualItems.map((virtualRow: VirtualItem) => {
                    const row = rows[virtualRow.index];
                    if (!row) return null;

                    return (
                      <TableRow
                        key={row.id}
                        data-index={virtualRow.index}
                        ref={(node) => rowVirtualizer.measureElement(node)}
                        data-state={row.getIsSelected() && "selected"}
                        className="group h-[57px] cursor-pointer select-text hover:bg-[#F2F1EF] hover:dark:bg-[#0f0f0f] flex items-center border-b border-border min-w-full"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        {row.getVisibleCells().map((cell, cellIndex, cells) => {
                          const columnId = cell.column.id;
                          const meta = cell.column.columnDef.meta as
                            | { sticky?: boolean; className?: string }
                            | undefined;
                          const isSticky = meta?.sticky ?? false;

                          const cellStyle = getCellStyle({
                            columnId,
                            cellIndex,
                            totalCells: cells.length,
                            lastCellId:
                              cells[cells.length - 1]?.column.id ?? "",
                            getStickyStyle,
                            isSticky,
                            columnSize: cell.column.getSize(),
                            minSize: cell.column.columnDef.minSize,
                          });

                          return (
                            <TableCell
                              key={cell.id}
                              className={`h-full flex items-center ${getStickyClassName(
                                columnId,
                                meta?.className,
                              )}`}
                              style={cellStyle}
                              onClick={() => {
                                // Don't navigate for select or actions column
                                if (
                                  columnId !== "select" &&
                                  columnId !== "actions"
                                ) {
                                  setParams({
                                    invoiceId: row.original.id,
                                    type: "details",
                                  });
                                }
                              }}
                            >
                              {columnId === "select" ? (
                                <Checkbox
                                  checked={row.getIsSelected()}
                                  onCheckedChange={(checked) => {
                                    if (checked === "indeterminate") {
                                      row.toggleSelected();
                                    } else {
                                      row.toggleSelected(checked);
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <div className="w-full overflow-hidden truncate">
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext(),
                                  )}
                                </div>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
      </div>

      <AnimatePresence>
        {showBottomBar && <BottomBar data={tableData} />}
      </AnimatePresence>
    </div>
  );
}
