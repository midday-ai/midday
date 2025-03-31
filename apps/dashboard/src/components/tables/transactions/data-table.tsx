"use client";

import { updateColumnVisibilityAction } from "@/actions/update-column-visibility-action";
import { useSortParams } from "@/hooks/use-sort-params";
import { useTransactionFilterParams } from "@/hooks/use-transaction-filter-params";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useTransactionsStore } from "@/store/transactions";
import { useTRPC } from "@/trpc/client";
import { Cookies } from "@/utils/constants";
import { Spinner } from "@midday/ui/spinner";
import { Table, TableBody, TableCell, TableRow } from "@midday/ui/table";
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
import { use, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useInView } from "react-intersection-observer";
import { BottomBar } from "./bottom-bar";
import { columns } from "./columns";
import { DataTableHeader } from "./data-table-header";
import { NoResults, NoTransactions } from "./empty-states";
import { ExportBar } from "./export-bar";
import { Loading } from "./loading";

export function DataTable({
  columnVisibility: columnVisibilityPromise,
}: { columnVisibility: Promise<VisibilityState> }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { filter } = useTransactionFilterParams();
  const { setRowSelection, rowSelection, setColumns, setCanDelete } =
    useTransactionsStore();
  const deferredSearch = useDeferredValue(filter.q);
  const { params } = useSortParams();
  const { ref, inView } = useInView();
  const { transactionId, setTransactionId } = useTransactionParams();
  const { hasFilters } = useTransactionFilterParams();

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

  const showBottomBar = hasFilters && !Object.keys(rowSelection).length;
  const initialColumnVisibility = use(columnVisibilityPromise);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility ?? {},
  );

  const infiniteQueryOptions = trpc.transactions.get.infiniteQueryOptions(
    {
      filter: {
        ...filter,
        q: deferredSearch,
      },
      sort: params.sort,
    },
    {
      getNextPageParam: ({ meta }) => {
        return meta?.cursor ?? undefined;
      },
    },
  );

  const { data, fetchNextPage, hasNextPage } =
    useSuspenseInfiniteQuery(infiniteQueryOptions);

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
        setTransactionId(id);
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
    },
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
          setTransactionId(prevId);
        }
      }

      if (key === "ArrowDown" && transactionId) {
        const currentIndex = ids?.indexOf(transactionId) ?? 0;
        const nextId = ids[currentIndex + 1];

        if (nextId) {
          setTransactionId(nextId);
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
          <Table>
            <DataTableHeader table={table} />

            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="h-[40px] md:h-[45px] cursor-pointer select-text"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        onClick={() => {
                          if (
                            cell.column.id !== "select" &&
                            cell.column.id !== "actions"
                          ) {
                            setTransactionId(row.original.id);
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

          {hasNextPage && (
            <div className="flex items-center justify-center mt-6" ref={ref}>
              <div className="flex items-center space-x-2 py-5">
                <Spinner />
                <span className="text-sm text-[#606060]">Loading more...</span>
              </div>
            </div>
          )}
        </Tooltip>
      </TooltipProvider>

      <ExportBar />

      {showBottomBar && (
        <BottomBar
          transactions={tableData.map((row) => ({
            amount: row?.amount ?? 0,
            currency: row?.currency ?? "",
          }))}
        />
      )}
    </div>
  );
}
