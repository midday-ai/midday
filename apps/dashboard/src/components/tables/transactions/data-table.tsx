"use client";

import { updateColumnVisibilityAction } from "@/actions/update-column-visibility-action";
import { LoadMore } from "@/components/load-more";
import { useSortParams } from "@/hooks/use-sort-params";
import { useStickyColumns } from "@/hooks/use-sticky-columns";
import { useTableScroll } from "@/hooks/use-table-scroll";
import { useTransactionFilterParamsWithPersistence } from "@/hooks/use-transaction-filter-params-with-persistence";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useUpdateTransactionCategory } from "@/hooks/use-update-transaction-category";
import { useTransactionsStore } from "@/store/transactions";
import { useTRPC } from "@/trpc/client";
import { Cookies } from "@/utils/constants";
import { cn } from "@midday/ui/cn";
import { Table, TableBody, TableCell, TableRow } from "@midday/ui/table";
import { ToastAction } from "@midday/ui/toast";
import { Tooltip, TooltipProvider } from "@midday/ui/tooltip";
import { toast } from "@midday/ui/use-toast";
import {
  useMutation,
  useQueryClient,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import {
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { AnimatePresence } from "framer-motion";
import {
  use,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useInView } from "react-intersection-observer";
import { BottomBar } from "./bottom-bar";
import { columns } from "./columns";
import { DataTableHeader } from "./data-table-header";
import { NoResults, NoTransactions } from "./empty-states";
import { ExportBar } from "./export-bar";
import { Loading } from "./loading";

type Props = {
  columnVisibility: Promise<VisibilityState>;
};

export function DataTable({
  columnVisibility: columnVisibilityPromise,
}: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { filter, hasFilters } = useTransactionFilterParamsWithPersistence();
  const {
    setRowSelection,
    rowSelection,
    setColumns,
    setCanDelete,
    lastClickedIndex,
    setLastClickedIndex,
  } = useTransactionsStore();
  const deferredSearch = useDeferredValue(filter.q);
  const { params } = useSortParams();
  const { ref, inView } = useInView();
  const { transactionId, setParams } = useTransactionParams();

  const showBottomBar = hasFilters && !Object.keys(rowSelection).length;
  const initialColumnVisibility = use(columnVisibilityPromise);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility ?? {},
  );

  const infiniteQueryOptions = trpc.transactions.get.infiniteQueryOptions(
    {
      ...filter,
      amountRange: filter.amount_range ?? null,
      q: deferredSearch,
      sort: params.sort,
      // When filters are active, load all results for analysis/export
      // Otherwise use default pagination for browsing
      pageSize: hasFilters ? 10000 : undefined,
    },
    {
      getNextPageParam: ({ meta }) => meta?.cursor,
    },
  );

  const { data, fetchNextPage, hasNextPage, refetch } =
    useSuspenseInfiniteQuery(infiniteQueryOptions);

  const updateTransactionMutation = useMutation(
    trpc.transactions.update.mutationOptions({
      onSuccess: () => {
        refetch();

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
        refetch();
      },
    }),
  );

  const updateTransactionsMutation = useMutation(
    trpc.transactions.updateMany.mutationOptions({
      onSuccess: () => {
        refetch();
      },
    }),
  );

  const { updateCategory } = useUpdateTransactionCategory({
    onSuccess: () => {
      refetch();
    },
  });

  useEffect(() => {
    if (inView) {
      fetchNextPage();
    }
  }, [inView]);

  const tableData = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  const ids = useMemo(() => {
    return tableData.map((row) => row?.id);
  }, [tableData]);

  // Poll if any transaction needs enrichment
  const shouldPollForEnrichment = useMemo(() => {
    if (tableData.length === 0) return false;
    // Check if ANY transaction needs enrichment, not just the first one
    return tableData.some((row) => !row?.enrichmentCompleted);
  }, [tableData]);

  // Poll for enrichment completion when needed
  useEffect(() => {
    if (!shouldPollForEnrichment) return;

    const pollInterval = setInterval(() => {
      refetch();
    }, 3000); // Poll every 3 seconds

    // Cleanup after 1 minute to avoid infinite polling
    const timeoutId = setTimeout(
      () => {
        clearInterval(pollInterval);
      },
      1 * 60 * 1000,
    );

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
    };
  }, [shouldPollForEnrichment, refetch]);

  // Handle shift-click range selection
  // Note: This function will be updated after table creation to use table.getRowModel().rows
  const handleShiftClickRangeRef = useRef<
    (startIndex: number, endIndex: number) => void
  >(() => {});

  const table = useReactTable({
    getRowId: (row) => row?.id,
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      rowSelection,
      columnVisibility,
    },
    meta: {
      setOpen: (id: string) => {
        setParams({ transactionId: id });
      },
      copyUrl: (id: string) => {
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
      },
      updateTransaction: (data: {
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
              slug: data.categorySlug, // TypeScript now knows this is string (not null)
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
      onDeleteTransaction: (id: string) => {
        deleteTransactionMutation.mutate([id]);
      },
      editTransaction: (id: string) => {
        setParams({ editTransaction: id });
      },
      handleShiftClickRange: (startIndex: number, endIndex: number) =>
        handleShiftClickRangeRef.current(startIndex, endIndex),
      lastClickedIndex,
      setLastClickedIndex,
    },
  });

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
  });

  // Use the reusable table scroll hook with column-width scrolling starting after sticky columns
  const tableScroll = useTableScroll({
    useColumnWidths: true,
    startFromColumn: 3, // Skip sticky columns: select, date, description
  });

  useEffect(() => {
    setColumns(table.getAllLeafColumns());
  }, [columnVisibility]);

  useEffect(() => {
    updateColumnVisibilityAction({
      key: Cookies.TransactionsColumns,
      data: columnVisibility,
    });
  }, [columnVisibility]);

  useEffect(() => {
    const transactions = tableData.filter((transaction) => {
      if (!transaction?.id) return false;
      const found = rowSelection[transaction.id];

      if (found) {
        return !transaction?.manual;
      }
      return false;
    });

    if (Object.keys(rowSelection)?.length > 0) {
      if (transactions.length === 0) {
        setCanDelete(true);
      } else {
        setCanDelete(false);
      }
    }
  }, [rowSelection]);

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
    return (
      <div className="relative h-[calc(100vh-200px)] overflow-hidden">
        <NoTransactions />
        <Loading isEmpty />
      </div>
    );
  }

  if (!tableData.length && hasFilters) {
    return (
      <div className="relative h-[calc(100vh-200px)] overflow-hidden">
        <NoResults />
        <Loading isEmpty />
      </div>
    );
  }

  return (
    <div className="relative">
      <TooltipProvider delayDuration={20}>
        <Tooltip>
          <div className="w-full">
            <div
              ref={tableScroll.containerRef}
              className="overflow-x-auto overscroll-x-none md:border-l md:border-r border-border scrollbar-hide"
            >
              <Table>
                <DataTableHeader table={table} tableScroll={tableScroll} />

                <TableBody className="border-l-0 border-r-0">
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row, rowIndex) => (
                      <TableRow
                        key={row.id}
                        className="group h-[40px] md:h-[45px] cursor-pointer select-text hover:bg-[#F2F1EF] hover:dark:bg-[#0f0f0f]"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={getStickyClassName(
                              cell.column.id,
                              cell.column.columnDef.meta?.className,
                            )}
                            style={getStickyStyle(cell.column.id)}
                            onClick={() => {
                              // Handle other column clicks (select column is handled in SelectCell)
                              if (
                                cell.column.id !== "select" &&
                                cell.column.id !== "actions" &&
                                cell.column.id !== "category" &&
                                cell.column.id !== "assigned" &&
                                cell.column.id !== "tags"
                              ) {
                                if (row.original.manual) {
                                  setParams({
                                    editTransaction: row.original.id,
                                  });
                                } else {
                                  setParams({ transactionId: row.original.id });
                                }
                              }
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
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
            </div>

            <LoadMore ref={ref} hasNextPage={hasNextPage} />
          </div>
        </Tooltip>
      </TooltipProvider>

      <ExportBar />

      <AnimatePresence>
        {showBottomBar && <BottomBar transactions={tableData} />}
      </AnimatePresence>
    </div>
  );
}
