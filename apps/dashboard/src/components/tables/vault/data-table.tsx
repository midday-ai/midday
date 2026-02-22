"use client";

import { closestCenter, DndContext } from "@dnd-kit/core";
import { Table, TableBody, TableCell, TableRow } from "@midday/ui/table";
import { toast } from "@midday/ui/use-toast";
import {
  useMutation,
  useQueryClient,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useVirtualizer, type VirtualItem } from "@tanstack/react-virtual";
import { AnimatePresence } from "framer-motion";
import { useCallback, useMemo, useRef } from "react";
import { useCopyToClipboard, useDebounceCallback } from "usehooks-ts";
import { VirtualRow } from "@/components/tables/core";
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
import { getColumnIds, type TableSettings } from "@/utils/table-settings";
import { BottomBar } from "./bottom-bar";
import { columns } from "./columns";
import { DataTableHeader } from "./data-table-header";

// Stable reference for non-clickable columns (avoids recreation on each render)
const NON_CLICKABLE_COLUMNS = new Set(["select", "tags", "actions"]);

const COLUMN_IDS = getColumnIds(columns);

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
    columnIds: COLUMN_IDS,
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
        pageSize: 24,
        ...filter,
      },
      {
        getNextPageParam: ({ meta }) => meta?.cursor,
      },
    ),
  );

  const baseDocuments = useMemo(() => {
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

  const documents = baseDocuments;

  const reprocessMutation = useMutation(
    trpc.documents.reprocessDocument.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.documents.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.documents.get.queryKey(),
        });
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

  const handleReprocess = useCallback(
    (id: string) => {
      toast({
        title: "Analyzing document",
        description: "The document is being analyzed. This may take a moment.",
        duration: 3000,
      });
      reprocessMutation.mutate({ id });
    },
    [reprocessMutation],
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
      handleReprocess,
    }),
    [handleDelete, handleShare, handleReprocess],
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

  // Stable cell click handler for VirtualRow
  const handleCellClick = useCallback(
    (rowId: string) => {
      setParams({ documentId: rowId });
    },
    [setParams],
  );

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
          className="overflow-auto overscroll-contain border-l border-r border-b border-border scrollbar-hide"
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
                className="border-l-0 border-r-0 block"
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
                      <VirtualRow
                        key={row.id}
                        row={row}
                        virtualStart={virtualRow.start}
                        rowHeight={45}
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
          {/* Spacer ensures scrolling works when content barely overflows */}
          <div
            style={{ height: "var(--header-offset, 0px)", flexShrink: 0 }}
            aria-hidden
          />
        </div>
      </div>

      <AnimatePresence>
        {showBottomBar && <BottomBar data={files} />}
      </AnimatePresence>
    </div>
  );
}
