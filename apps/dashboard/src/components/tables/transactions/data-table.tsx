"use client";

import { updateColumnVisibilityAction } from "@/actions/update-column-visibility-action";
import { LoadMore } from "@/components/load-more";
import { useSortParams } from "@/hooks/use-sort-params";
import { useStickyColumns } from "@/hooks/use-sticky-columns";
import { useTableScroll } from "@/hooks/use-table-scroll";
import { useTransactionFilterParamsWithPersistence } from "@/hooks/use-transaction-filter-params-with-persistence";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useTransactionsStore } from "@/store/transactions";
import { useTRPC } from "@/trpc/client";
import { Cookies } from "@/utils/constants";
import { cn } from "@midday/ui/cn";
import { Table, TableBody, TableCell, TableRow } from "@midday/ui/table";
import { Tooltip, TooltipProvider } from "@midday/ui/tooltip";
import { toast } from "@midday/ui/use-toast";
import { useMutation, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import {
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { AnimatePresence } from "framer-motion";
import { use, useDeferredValue, useEffect, useMemo, useState } from "react";
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
  const { filter, hasFilters } = useTransactionFilterParamsWithPersistence();
  const { setRowSelection, rowSelection, setColumns, setCanDelete } =
    useTransactionsStore();
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
      q: deferredSearch,
      sort: params.sort,
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

  // Only poll if the first transaction needs enrichment
  const shouldPollForEnrichment = useMemo(() => {
    if (tableData.length === 0) return false;
    // Focus on the first transaction (most recent) since table is sorted by date desc
    return !tableData.at(0)?.enrichmentCompleted;
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
      updateTransaction: (data: { id: string; status: string }) => {
        updateTransactionMutation.mutate({
          id: data.id,
          status: data.status as
            | "pending"
            | "archived"
            | "completed"
            | "posted"
            | "excluded",
        });
      },
      onDeleteTransaction: (id: string) => {
        deleteTransactionMutation.mutate([id]);
      },
    },
  });

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
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="group h-[40px] md:h-[45px] cursor-pointer select-text hover:bg-[#F2F1EF] hover:dark:bg-secondary"
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
                              if (
                                cell.column.id !== "select" &&
                                cell.column.id !== "actions"
                              ) {
                                setParams({ transactionId: row.original.id });
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

      <AnimatePresence>{showBottomBar && <BottomBar />}</AnimatePresence>
    </div>
  );
}
