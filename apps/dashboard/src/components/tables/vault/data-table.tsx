"use client";

import { getCellStyle } from "@/components/tables/core";
import { NoResults } from "@/components/vault/empty-states";
import { VaultGetStarted } from "@/components/vault/vault-get-started";
import { useDocumentFilterParams } from "@/hooks/use-document-filter-params";
import { useDocumentParams } from "@/hooks/use-document-params";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useRealtime } from "@/hooks/use-realtime";
import { useScrollHeader } from "@/hooks/use-scroll-header";
import { useStickyColumns } from "@/hooks/use-sticky-columns";
import { useTableDnd } from "@/hooks/use-table-dnd";
import { useTableScroll } from "@/hooks/use-table-scroll";
import { useTableSettings } from "@/hooks/use-table-settings";
import { useUserQuery } from "@/hooks/use-user";
import { useDocumentsStore } from "@/store/vault";
import { useTRPC } from "@/trpc/client";
import { STICKY_COLUMNS } from "@/utils/table-configs";
import type { TableSettings } from "@/utils/table-settings";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { Checkbox } from "@midday/ui/checkbox";
import { Table, TableBody, TableCell, TableRow } from "@midday/ui/table";
import {
  useMutation,
  useQueryClient,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { type VirtualItem, useVirtualizer } from "@tanstack/react-virtual";
import { AnimatePresence } from "framer-motion";
import { useCallback, useMemo, useRef } from "react";
import { useCopyToClipboard, useDebounceCallback } from "usehooks-ts";
import { BottomBar } from "./bottom-bar";
import { columns } from "./columns";
import { DataTableHeader } from "./data-table-header";

type Props = {
  initialSettings?: Partial<TableSettings>;
};

export function DataTable({ initialSettings }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: user } = useUserQuery();
  const { filter, hasFilters } = useDocumentFilterParams();
  const { setRowSelection, rowSelection } = useDocumentsStore();
  const { setParams, params } = useDocumentParams();
  const [, copy] = useCopyToClipboard();
  const parentRef = useRef<HTMLDivElement>(null);

  // Hide header on scroll
  useScrollHeader(parentRef);

  // Use unified table settings hook for column state management
  const {
    columnVisibility,
    setColumnVisibility,
    columnSizing,
    setColumnSizing,
    columnOrder,
    setColumnOrder,
  } = useTableSettings({
    tableId: "vault",
    initialSettings,
  });

  // Use the reusable table scroll hook
  const tableScroll = useTableScroll({
    useColumnWidths: true,
    startFromColumn: 2, // Skip sticky columns: select, title
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    refetch,
    isFetching,
    isFetchingNextPage,
  } = useSuspenseInfiniteQuery(
    trpc.documents.get.infiniteQueryOptions(
      {
        pageSize: 20,
        ...filter,
      },
      {
        getNextPageParam: ({ meta }) => meta?.cursor,
      },
    ),
  );

  const documents = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  const debouncedEventHandler = useDebounceCallback(() => {
    refetch();

    queryClient.invalidateQueries({
      queryKey: trpc.documents.get.queryKey(),
    });
  }, 50);

  useRealtime({
    channelName: "realtime_documents",
    table: "documents",
    filter: `team_id=eq.${user?.teamId}`,
    onEvent: (payload) => {
      if (
        payload.eventType === "INSERT" ||
        (payload.eventType === "UPDATE" && params.view === "list")
      ) {
        debouncedEventHandler();
      }
    },
  });

  const deleteDocumentMutation = useMutation(
    trpc.documents.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.documents.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.documents.get.queryKey(),
        });

        // Invalidate global search
        queryClient.invalidateQueries({
          queryKey: trpc.search.global.queryKey(),
        });
      },
    }),
  );

  const shortLinkMutation = useMutation(
    trpc.shortLinks.createForDocument.mutationOptions({
      onSuccess: (data) => {
        if (data?.shortUrl) {
          copy(data.shortUrl);
        }
      },
    }),
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteDocumentMutation.mutate({
        id,
      });
    },
    [deleteDocumentMutation],
  );

  const handleShare = useCallback(
    (filePath: string[]) => {
      shortLinkMutation.mutate({
        filePath: filePath?.join("/") ?? "",
        expireIn: 60 * 60 * 24 * 30, // 30 days
      });
    },
    [shortLinkMutation],
  );

  const files = useMemo(() => {
    return documents.map((document) => document.pathTokens?.join("/") ?? "");
  }, [documents]);

  const showBottomBar = Object.keys(rowSelection).length > 0;

  // Memoize table meta
  const tableMeta = useMemo(
    () => ({
      handleDelete,
      handleShare,
    }),
    [handleDelete, handleShare],
  );

  const table = useReactTable({
    data: documents,
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
    meta: tableMeta,
    state: {
      columnVisibility,
      columnSizing,
      columnOrder,
      rowSelection,
    },
  });

  // DnD for column reordering
  const { sensors, handleDragEnd } = useTableDnd(table);

  // Use the reusable sticky columns hook
  const { getStickyStyle, getStickyClassName } = useStickyColumns({
    columnVisibility,
    table,
    stickyColumns: STICKY_COLUMNS.vault,
  });

  const rows = table.getRowModel().rows;

  // Row virtualizer for performance
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45, // Row height in pixels
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

  if (hasFilters && !documents?.length) {
    return <NoResults />;
  }

  if (!documents?.length && !isFetching) {
    return <VaultGetStarted />;
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
            height: "calc(100vh - 180px + var(--header-offset, 0px))",
          }}
        >
          <DndContext
            id="vault-table-dnd"
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
                        className="group h-[45px] cursor-pointer select-text hover:bg-[#F2F1EF] hover:dark:bg-[#0f0f0f] flex items-center border-b border-border min-w-full"
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
                                // Don't navigate for select, tags, or actions column
                                if (
                                  columnId !== "select" &&
                                  columnId !== "tags" &&
                                  columnId !== "actions"
                                ) {
                                  setParams({ documentId: row.original.id });
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
        {showBottomBar && <BottomBar data={files} />}
      </AnimatePresence>
    </div>
  );
}
