"use client";

import { useCustomerFilterParams } from "@/hooks/use-customer-filter-params";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { useScrollHeader } from "@/hooks/use-scroll-header";
import { useSortParams } from "@/hooks/use-sort-params";
import { useStickyColumns } from "@/hooks/use-sticky-columns";
import { useTableScroll } from "@/hooks/use-table-scroll";
import { useTableSettings } from "@/hooks/use-table-settings";
import { useTRPC } from "@/trpc/client";
import type { TableSettings } from "@/utils/table-settings";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Table, TableBody, TableCell, TableRow } from "@midday/ui/table";
import { useMutation, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { type VirtualItem, useVirtualizer } from "@tanstack/react-virtual";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { columns } from "./columns";
import { EmptyState, NoResults } from "./empty-states";
import { DataTableHeader } from "./table-header";

// Height of the summary grid (4 cards) - used for extra scroll offset
const SUMMARY_GRID_HEIGHT = 150;

type Props = {
  initialSettings?: Partial<TableSettings>;
};

export function DataTable({ initialSettings }: Props) {
  const trpc = useTRPC();
  const { setParams } = useCustomerParams();
  const { filter, hasFilters } = useCustomerFilterParams();
  const { params } = useSortParams();
  const parentRef = useRef<HTMLDivElement>(null);

  const deferredSearch = useDeferredValue(filter.q);

  // Hide header and summary grid on scroll
  useScrollHeader(parentRef, { extraOffset: SUMMARY_GRID_HEIGHT });

  // Use unified table settings hook for column state management
  const {
    columnVisibility,
    setColumnVisibility,
    columnSizing,
    setColumnSizing,
    columnOrder,
    setColumnOrder,
  } = useTableSettings({
    tableId: "customers",
    initialSettings,
  });

  const infiniteQueryOptions = trpc.customers.get.infiniteQueryOptions(
    {
      ...filter,
      sort: params.sort,
      q: deferredSearch,
    },
    {
      getNextPageParam: ({ meta }) => meta?.cursor,
    },
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useSuspenseInfiniteQuery(infiniteQueryOptions);

  const deleteCustomerMutation = useMutation(
    trpc.customers.delete.mutationOptions({
      onSuccess: () => {
        refetch();
      },
    }),
  );

  const handleDeleteCustomer = useCallback(
    (id: string) => {
      deleteCustomerMutation.mutate({ id });
    },
    [deleteCustomerMutation],
  );

  const tableData = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  const setOpen = useCallback(
    (id?: string) => {
      if (id) {
        setParams({ customerId: id, details: true });
      } else {
        setParams(null);
      }
    },
    [setParams],
  );

  const tableMeta = useMemo(
    () => ({
      deleteCustomer: handleDeleteCustomer,
    }),
    [handleDeleteCustomer],
  );

  const table = useReactTable({
    data: tableData,
    getRowId: (row) => row.id,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: setColumnOrder,
    state: {
      columnVisibility,
      columnSizing,
      columnOrder,
    },
    meta: tableMeta,
  });

  // DnD sensors for column reordering
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const currentOrder = table.getAllLeafColumns().map((col) => col.id);
      const oldIndex = currentOrder.indexOf(active.id as string);
      const newIndex = currentOrder.indexOf(over.id as string);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(currentOrder, oldIndex, newIndex);
        table.setColumnOrder(newOrder);
      }
    },
    [table],
  );

  // Use the reusable sticky columns hook
  const { getStickyStyle, getStickyClassName } = useStickyColumns({
    columnVisibility,
    table,
  });

  // Use the reusable table scroll hook
  const tableScroll = useTableScroll({
    useColumnWidths: true,
    startFromColumn: 1, // Skip sticky name column
  });

  const rows = table.getRowModel().rows;

  // Row virtualizer for performance
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45,
    overscan: 10,
  });

  // Trigger infinite load when scrolling near the bottom
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    const checkLoadMore = () => {
      if (isFetchingNextPage) return;

      const virtualItems = rowVirtualizer.getVirtualItems();
      const lastItem = virtualItems[virtualItems.length - 1];

      if (lastItem && lastItem.index >= rows.length - 50 && hasNextPage) {
        fetchNextPage();
      }
    };

    checkLoadMore();

    scrollElement.addEventListener("scroll", checkLoadMore);
    return () => scrollElement.removeEventListener("scroll", checkLoadMore);
  }, [
    rowVirtualizer,
    rows.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  if (!tableData.length && hasFilters) {
    return <NoResults />;
  }

  if (!tableData.length) {
    return <EmptyState />;
  }

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className="relative">
      <div className="w-full">
        <div
          ref={(el) => {
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
            height: "calc(100vh - 330px + var(--header-offset, 0px))",
          }}
        >
          <DndContext
            id="customers-table-dnd"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table>
              <DataTableHeader table={table} tableScroll={tableScroll} />

              <TableBody
                className="border-l-0 border-r-0"
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
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
                        className="group h-[45px] cursor-pointer select-text hover:bg-[#F2F1EF] hover:dark:bg-[#0f0f0f] flex items-center border-b border-border"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        {row.getVisibleCells().map((cell, cellIndex, cells) => {
                          const isActions = cell.column.id === "actions";
                          const meta = cell.column.columnDef.meta as
                            | { sticky?: boolean; className?: string }
                            | undefined;
                          const isSticky = meta?.sticky;
                          // Check if this is the last column before actions (should flex to fill space)
                          const isLastBeforeActions =
                            cellIndex === cells.length - 2 &&
                            cells[cells.length - 1]?.column.id === "actions";

                          return (
                            <TableCell
                              key={cell.id}
                              className={`h-full flex items-center ${getStickyClassName(
                                cell.column.id,
                                meta?.className,
                              )}`}
                              style={{
                                width: cell.column.getSize(),
                                minWidth: isSticky
                                  ? cell.column.getSize()
                                  : cell.column.columnDef.minSize,
                                maxWidth: isSticky
                                  ? cell.column.getSize()
                                  : undefined,
                                ...getStickyStyle(cell.column.id),
                                ...(isLastBeforeActions && {
                                  flex: 1,
                                }),
                                ...(isActions && {
                                  borderLeft: "1px solid hsl(var(--border))",
                                  borderBottom: "1px solid hsl(var(--border))",
                                  borderRight: "none",
                                  zIndex: 50,
                                }),
                              }}
                              onClick={() => {
                                if (cell.column.id !== "actions") {
                                  setOpen(row.original.id);
                                }
                              }}
                            >
                              <div className="w-full overflow-hidden truncate">
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext(),
                                )}
                              </div>
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
    </div>
  );
}
