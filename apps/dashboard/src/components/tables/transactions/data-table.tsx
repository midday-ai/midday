"use client";

import { updateColumnVisibilityAction } from "@/actions/update-column-visibility-action";
import { LoadMore } from "@/components/load-more";
import { useSortParams } from "@/hooks/use-sort-params";
import { useTransactionFilterParams } from "@/hooks/use-transaction-filter-params";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useTransactionsStore } from "@/store/transactions";
import { useTRPC } from "@/trpc/client";
import { Cookies } from "@/utils/constants";
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
  const { filter } = useTransactionFilterParams();
  const { setRowSelection, rowSelection, setColumns, setCanDelete } =
    useTransactionsStore();
  const deferredSearch = useDeferredValue(filter.q);
  const { params } = useSortParams();
  const { ref, inView } = useInView();
  const { transactionId, setParams } = useTransactionParams();
  const { hasFilters } = useTransactionFilterParams();

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

          <LoadMore ref={ref} hasNextPage={hasNextPage} />
        </Tooltip>
      </TooltipProvider>

      <ExportBar />

      <AnimatePresence>{showBottomBar && <BottomBar />}</AnimatePresence>
    </div>
  );
}
