"use client";

import { closestCenter, DndContext } from "@dnd-kit/core";
import { Table, TableBody } from "@midday/ui/table";
import { Tooltip, TooltipProvider } from "@midday/ui/tooltip";
import { toast } from "@midday/ui/use-toast";
import {
  useMutation,
  useQueryClient,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useVirtualizer, type VirtualItem } from "@tanstack/react-virtual";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useDebounceCallback } from "usehooks-ts";
import { VirtualRow } from "@/components/tables/core";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useRealtime } from "@/hooks/use-realtime";
import { useScrollHeader } from "@/hooks/use-scroll-header";
import { useSortParams } from "@/hooks/use-sort-params";
import { useStickyColumns } from "@/hooks/use-sticky-columns";
import { useTableDnd } from "@/hooks/use-table-dnd";
import { useTableScroll } from "@/hooks/use-table-scroll";
import { useTableSettings } from "@/hooks/use-table-settings";
import { useTransactionFilterParamsWithPersistence } from "@/hooks/use-transaction-filter-params-with-persistence";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useTransactionTab } from "@/hooks/use-transaction-tab";
import { useUpdateTransactionCategory } from "@/hooks/use-update-transaction-category";
import { useUploadProcessingToast } from "@/hooks/use-upload-processing-toast";
import { useUserQuery } from "@/hooks/use-user";
import { useExportStore } from "@/store/export";
import {
  type TransactionTab,
  useTransactionsStore,
} from "@/store/transactions";
import { useTRPC } from "@/trpc/client";
import { STICKY_COLUMNS } from "@/utils/table-configs";
import { getColumnIds, type TableSettings } from "@/utils/table-settings";
import { BulkEditBar } from "./bulk-edit-bar";
import { columns } from "./columns";
import { DataTableHeader } from "./data-table-header";
import { NoResults, NoTransactions, ReviewComplete } from "./empty-states";
import { ExportBar } from "./export-bar";
import { TransactionTableProvider } from "./transaction-table-context";

// Stable reference for non-clickable columns (avoids recreation on each render)
const NON_CLICKABLE_COLUMNS = new Set([
  "select",
  "actions",
  "category",
  "assigned",
  "tags",
]);

const COLUMN_IDS = getColumnIds(columns);

type Props = {
  initialSettings?: Partial<TableSettings>;
  initialTab?: "all" | "review";
};

export function DataTable({ initialSettings, initialTab }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: user } = useUserQuery();
  const { filter, hasFilters } = useTransactionFilterParamsWithPersistence();
  const { tab } = useTransactionTab();
  const {
    setRowSelection: setRowSelectionForTab,
    rowSelectionByTab,
    setColumns,
    setCanDelete,
    lastClickedIndex,
    setLastClickedIndex,
  } = useTransactionsStore();
  const { exportingTransactionIds } = useExportStore();
  const deferredSearch = useDeferredValue(filter.q);
  const { params } = useSortParams();
  const { transactionId, setParams } = useTransactionParams();
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
    tableId: "transactions",
    initialSettings,
    columnIds: COLUMN_IDS,
  });

  // Use the current tab from URL, falling back to initial value
  const activeTab = (tab ?? initialTab ?? "all") as TransactionTab;
  const isReviewTab = activeTab === "review";

  // Get tab-specific row selection
  const rowSelection = rowSelectionByTab[activeTab];
  const setRowSelection = useCallback(
    (updater: Parameters<typeof setRowSelectionForTab>[1]) => {
      setRowSelectionForTab(activeTab, updater);
    },
    [activeTab, setRowSelectionForTab],
  );

  // Build query filters based on active tab
  // Review tab: show fulfilled transactions (has attachments OR completed) that are not yet exported
  const queryFilter = useMemo(() => {
    if (isReviewTab) {
      return {
        ...filter,
        amountRange: filter.amount_range ?? null,
        q: deferredSearch,
        sort: params.sort,
        // Fulfilled = has attachments OR status=completed
        fulfilled: true,
        // Only show transactions not yet exported
        exported: false,
        pageSize: 10000, // Load all for review
      };
    }
    return {
      ...filter,
      amountRange: filter.amount_range ?? null,
      q: deferredSearch,
      sort: params.sort,
      // When filters are active, load all results for analysis/export
      // Otherwise use default pagination for browsing
      pageSize: hasFilters ? 10000 : undefined,
    };
  }, [filter, deferredSearch, params.sort, isReviewTab, hasFilters]);

  const infiniteQueryOptions = trpc.transactions.get.infiniteQueryOptions(
    queryFilter,
    {
      getNextPageParam: ({ meta }) => meta?.cursor,
    },
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useSuspenseInfiniteQuery(infiniteQueryOptions);

  // Debounced refetch for realtime updates
  const debouncedRefetch = useDebounceCallback(() => {
    refetch();
    // Also invalidate related queries
    queryClient.invalidateQueries({
      queryKey: trpc.transactions.getReviewCount.queryKey(),
    });
  }, 200);

  // Realtime subscription for transaction updates
  useRealtime({
    channelName: "realtime_transactions",
    table: "transactions",
    filter: user?.teamId ? `team_id=eq.${user.teamId}` : undefined,
    onEvent: (payload) => {
      if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        debouncedRefetch();
      }
    },
  });

  // Handle upload processing toast and inbox status tracking
  useUploadProcessingToast({
    teamId: user?.teamId as string,
    onStatusChange: debouncedRefetch,
  });

  const updateTransactionMutation = useMutation(
    trpc.transactions.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.get.infiniteQueryKey(),
        });

        toast({
          title: "Transaction updated",
          variant: "success",
        });
      },
    }),
  );

  const deleteTransactionMutation = useMutation(
    trpc.transactions.deleteMany.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.get.infiniteQueryKey(),
        });

        // Invalidate inbox queries since matched inbox items are cleared
        queryClient.invalidateQueries({
          queryKey: trpc.inbox.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.inbox.getById.queryKey(),
        });
      },
    }),
  );

  const moveToReviewMutation = useMutation(
    trpc.transactions.moveToReview.mutationOptions({
      onSuccess: () => {
        // Invalidate transactions and review count
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.get.infiniteQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.getReviewCount.queryKey(),
        });

        toast({
          title: "Transaction moved to review",
          variant: "success",
        });
      },
    }),
  );

  const { updateCategory } = useUpdateTransactionCategory({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.transactions.get.infiniteQueryKey(),
      });
    },
  });

  const tableData = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  const ids = useMemo(() => {
    return tableData.map((row) => row?.id);
  }, [tableData]);

  // Handle shift-click range selection
  // Note: This function will be updated after table creation to use table.getRowModel().rows
  const handleShiftClickRangeRef = useRef<
    (startIndex: number, endIndex: number) => void
  >(() => {});

  // Memoized table meta callbacks for stable references (prevents unnecessary re-renders)
  const setOpen = useCallback(
    (id: string) => {
      setParams({ transactionId: id });
    },
    [setParams],
  );

  const copyUrl = useCallback((id: string) => {
    try {
      window.navigator.clipboard.writeText(
        `${process.env.NEXT_PUBLIC_URL}/transactions/?transactionId=${id}`,
      );

      toast({
        title: "Transaction URL copied to clipboard",
        variant: "success",
      });
    } catch {
      toast({
        title: "Failed to copy transaction URL to clipboard",
        variant: "error",
      });
    }
  }, []);

  const updateTransaction = useCallback(
    (data: {
      id: string;
      status?: string;
      categorySlug?: string | null;
      categoryName?: string;
      assignedId?: string | null;
    }) => {
      // If updating category, use the hook that checks for similar transactions
      if (
        data.categorySlug !== undefined &&
        data.categorySlug !== null &&
        data.categoryName
      ) {
        const transaction = tableData.find((t) => t.id === data.id);
        if (transaction) {
          updateCategory(transaction.id, transaction.name, {
            name: data.categoryName,
            slug: data.categorySlug,
          });
        }
        return;
      }

      // Handle null category (uncategorizing)
      if (data.categorySlug === null) {
        updateTransactionMutation.mutate({
          id: data.id,
          categorySlug: null,
        });
        return;
      }

      // For other updates (status, assignedId), use the regular mutation
      updateTransactionMutation.mutate({
        id: data.id,
        ...(data.status && {
          status: data.status as
            | "pending"
            | "archived"
            | "completed"
            | "posted"
            | "excluded",
        }),
        ...(data.assignedId !== undefined && {
          assignedId: data.assignedId,
        }),
      });
    },
    [tableData, updateCategory, updateTransactionMutation],
  );

  const onDeleteTransaction = useCallback(
    (id: string) => {
      deleteTransactionMutation.mutate([id]);
    },
    [deleteTransactionMutation],
  );

  const moveToReview = useCallback(
    (id: string) => {
      moveToReviewMutation.mutate({ transactionId: id });
    },
    [moveToReviewMutation],
  );

  const editTransaction = useCallback(
    (id: string) => {
      setParams({ editTransaction: id });
    },
    [setParams],
  );

  const handleShiftClickRange = useCallback(
    (startIndex: number, endIndex: number) =>
      handleShiftClickRangeRef.current(startIndex, endIndex),
    [],
  );

  // Memoize the meta object to prevent table re-renders
  const tableMeta = useMemo(
    () => ({
      dateFormat: user?.dateFormat,
      setOpen,
      copyUrl,
      updateTransaction,
      onDeleteTransaction,
      editTransaction,
      moveToReview,
      handleShiftClickRange,
      lastClickedIndex,
      setLastClickedIndex,
      exportingTransactionIds,
    }),
    [
      user?.dateFormat,
      setOpen,
      copyUrl,
      updateTransaction,
      onDeleteTransaction,
      editTransaction,
      moveToReview,
      handleShiftClickRange,
      lastClickedIndex,
      setLastClickedIndex,
      exportingTransactionIds,
    ],
  );

  const table = useReactTable({
    getRowId: (row) => row?.id,
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    // Column resizing
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: setColumnOrder,
    state: {
      rowSelection,
      columnVisibility,
      columnSizing,
      columnOrder,
    },
    meta: tableMeta,
  });

  // DnD for column reordering
  const { sensors, handleDragEnd } = useTableDnd(table);

  // Update handleShiftClickRange to use the table
  handleShiftClickRangeRef.current = useCallback(
    (startIndex: number, endIndex: number) => {
      const rows = table.getRowModel().rows;
      const start = Math.min(startIndex, endIndex);
      const end = Math.max(startIndex, endIndex);

      // Check if all items in range are already selected
      let allSelected = true;
      for (let i = start; i <= end; i++) {
        const row = rows[i];
        if (row && !rowSelection[row.id]) {
          allSelected = false;
          break;
        }
      }

      // Toggle: if all selected, deselect; otherwise select all
      setRowSelection((prev) => {
        const newSelection = { ...prev };
        for (let i = start; i <= end; i++) {
          const row = rows[i];
          if (row) {
            if (allSelected) {
              delete newSelection[row.id];
            } else {
              newSelection[row.id] = true;
            }
          }
        }
        return newSelection;
      });
    },
    [table, rowSelection, setRowSelection],
  );

  // Use the reusable sticky columns hook
  const { getStickyStyle, getStickyClassName } = useStickyColumns({
    columnVisibility,
    table,
    stickyColumns: STICKY_COLUMNS.transactions,
  });

  // Use the reusable table scroll hook with column-width scrolling starting after sticky columns
  const tableScroll = useTableScroll({
    useColumnWidths: true,
    startFromColumn: 3, // Skip sticky columns: select, date, description
  });

  const rows = table.getRowModel().rows;

  // Stable cell click handler for VirtualRow
  const handleCellClick = useCallback(
    (rowId: string) => {
      setParams({ transactionId: rowId });
    },
    [setParams],
  );

  // Row virtualizer for performance
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45, // Row height in pixels
    overscan: 10, // Number of rows to render outside visible area
  });

  // Trigger infinite load when scrolling near the bottom
  useInfiniteScroll<HTMLDivElement>({
    scrollRef: parentRef,
    rowVirtualizer,
    rowCount: rows.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    threshold: 50,
  });

  useEffect(() => {
    setColumns(table.getAllLeafColumns());
  }, [columnVisibility, setColumns, table]);

  // Determine if selected transactions can be deleted (only manual transactions can be deleted)
  useEffect(() => {
    const selectedIds = Object.keys(rowSelection);

    // No selections means nothing can be deleted
    if (selectedIds.length === 0) {
      setCanDelete(false);
      return;
    }

    // Check if any selected non-manual transaction exists (these cannot be deleted)
    const hasNonManualSelected = selectedIds.some((id) => {
      const transaction = tableData.find((t) => t?.id === id);
      return transaction && !transaction.manual;
    });

    // Can delete only if all selected transactions are manual
    setCanDelete(!hasNonManualSelected);
  }, [rowSelection, tableData, setCanDelete]);

  useHotkeys(
    "ArrowUp, ArrowDown",
    ({ key }) => {
      if (key === "ArrowUp" && transactionId) {
        const currentIndex = ids?.indexOf(transactionId) ?? 0;
        const prevId = ids[currentIndex - 1];

        if (prevId) {
          setParams({ transactionId: prevId });
        }
      }

      if (key === "ArrowDown" && transactionId) {
        const currentIndex = ids?.indexOf(transactionId) ?? 0;
        const nextId = ids[currentIndex + 1];

        if (nextId) {
          setParams({ transactionId: nextId });
        }
      }
    },
    { enabled: !!transactionId },
  );

  if (!tableData.length && !hasFilters) {
    if (isReviewTab) {
      return (
        <div className="relative h-[calc(100vh-200px)] overflow-hidden">
          <ReviewComplete />
        </div>
      );
    }
    return (
      <div className="relative h-[calc(100vh-200px)] overflow-hidden">
        <NoTransactions />
      </div>
    );
  }

  if (!tableData.length && hasFilters) {
    return (
      <div className="relative h-[calc(100vh-200px)] overflow-hidden">
        <NoResults />
      </div>
    );
  }

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <TransactionTableProvider>
      <div className="relative">
        <TooltipProvider delayDuration={20}>
          <Tooltip>
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
                className="overflow-auto overscroll-none border-l border-r border-b border-border scrollbar-hide"
                style={{
                  height: "calc(100vh - 180px + var(--header-offset, 0px))",
                }}
              >
                <DndContext
                  id="transactions-table-dnd"
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
                            rowHeight={45}
                            getStickyStyle={getStickyStyle}
                            getStickyClassName={getStickyClassName}
                            nonClickableColumns={NON_CLICKABLE_COLUMNS}
                            onCellClick={handleCellClick}
                            columnSizing={columnSizing}
                            columnOrder={columnOrder}
                            columnVisibility={columnVisibility}
                            isSelected={rowSelection[row.id] ?? false}
                            isExporting={exportingTransactionIds.includes(
                              row.id,
                            )}
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
          </Tooltip>
        </TooltipProvider>

        <ExportBar />
        <BulkEditBar />
      </div>
    </TransactionTableProvider>
  );
}
