"use client";

import { deleteTransactionsAction } from "@/actions/delete-transactions-action";
import type { UpdateTransactionValues } from "@/actions/schema";
import { updateColumnVisibilityAction } from "@/actions/update-column-visibility-action";
import { updateTransactionAction } from "@/actions/update-transaction-action";
import { TransactionSheet } from "@/components/sheets/transaction-sheet";
import { useTransactionsStore } from "@/store/transactions";
import { useUserContext } from "@/store/user/hook";
import { Cookies } from "@/utils/constants";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Spinner } from "@midday/ui/spinner";
import { Table, TableBody, TableCell, TableRow } from "@midday/ui/table";
import { useToast } from "@midday/ui/use-toast";
import {
  type ColumnDef,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useAction } from "next-safe-action/hooks";
import { useQueryState } from "nuqs";
import { useEffect } from "react";
import { useState } from "react";
import { useInView } from "react-intersection-observer";
import { BottomBar } from "./bottom-bar";
import { DataTableHeader } from "./data-table-header";
import { ExportBar } from "./export-bar";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  hasNextPage?: boolean;
  hasFilters?: boolean;
  hasSorting?: boolean;
  loadMore: () => void;
  query?: string;
  pageSize: number;
  meta: Record<string, string>;
  initialColumnVisibility: VisibilityState;
}

export function DataTable<TData, TValue>({
  columns,
  query,
  hasSorting,
  data: initialData,
  pageSize,
  loadMore,
  meta: pageMeta,
  hasFilters,
  hasNextPage: initialHasNextPage,
  initialColumnVisibility,
}: DataTableProps<TData, TValue>) {
  const { toast } = useToast();
  const [data, setData] = useState(initialData);
  const [from, setFrom] = useState(pageSize);
  const { ref, inView } = useInView();
  const { date_format: dateFormat } = useUserContext((state) => state.data);

  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const { setColumns, setCanDelete, rowSelection, setRowSelection } =
    useTransactionsStore();

  const [transactionId, setTransactionId] = useQueryState("id");
  const selectedRows = Object.keys(rowSelection).length;

  const showBottomBar =
    (hasFilters && !selectedRows) || (query && !selectedRows);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility ?? {},
  );

  const updateTransaction = useAction(updateTransactionAction, {
    onSuccess: ({ data }) => {
      if (data?.status === "excluded") {
        toast({
          duration: 3500,
          title: "Transaction excluded",
          description:
            "You can view excluded transactions by adding the filter excluded.",
        });
      }
    },
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
  });

  const handleUpdateTransaction = (
    values: UpdateTransactionValues,
    optimisticData?: any,
  ) => {
    setData((prev) => {
      return prev.map((item) => {
        if (item.id === values.id) {
          return {
            ...item,
            ...values,
            ...(optimisticData ?? {}),
          };
        }

        return item;
      });
    });

    updateTransaction.execute(values);
  };

  const deleteTransactions = useAction(deleteTransactionsAction, {
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
  });

  const handleDeleteTransactions = ({ ids }) => {
    setData((prev) => {
      return prev.filter((item) => !ids?.includes(item.id));
    });

    deleteTransactions.execute({ ids });
  };

  const setOpen = (id: string | boolean) => {
    if (id) {
      setTransactionId(id);
    } else {
      setTransactionId(null);
    }
  };

  const handleCopyUrl = async (id: string) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/transactions?id=${id}`,
      );

      toast({
        duration: 4000,
        title: "Copied URL to clipboard.",
        variant: "success",
      });
    } catch {}
  };

  const table = useReactTable({
    getRowId: (row) => row.id,
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    meta: {
      setOpen,
      copyUrl: handleCopyUrl,
      updateTransaction: handleUpdateTransaction,
      deleteTransactions: handleDeleteTransactions,
      dateFormat,
      hasSorting,
    },
    state: {
      rowSelection,
      columnVisibility,
    },
  });

  const loadMoreData = async () => {
    const formatedFrom = from;
    const to = formatedFrom + pageSize * 2;

    try {
      const { data, meta } = await loadMore({
        from: formatedFrom,
        to,
      });

      setData((prev) => [...prev, ...data]);
      setFrom(to);
      setHasNextPage(meta.count > to);
    } catch {
      setHasNextPage(false);
    }
  };

  const selectedTransaction = data.find(
    (transaction) => transaction?.id === transactionId,
  );

  useEffect(() => {
    setColumns(table.getAllLeafColumns());
  }, [columnVisibility]);

  useEffect(() => {
    const transactions = data.filter((transaction) => {
      const found = rowSelection[transaction.id];
      if (found) {
        return !transaction?.manual;
      }
    });

    if (Object.keys(rowSelection)?.length > 0) {
      if (transactions.length === 0) {
        setCanDelete(true);
      } else {
        setCanDelete(false);
      }
    }
  }, [rowSelection]);

  useEffect(() => {
    updateColumnVisibilityAction({
      key: Cookies.TransactionsColumns,
      data: columnVisibility,
    });
  }, [columnVisibility]);

  useEffect(() => {
    if (inView) {
      loadMoreData();
    }
  }, [inView]);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  return (
    <div className="mb-8 relative">
      <Table>
        <DataTableHeader table={table} />

        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="h-[40px] md:h-[45px] cursor-pointer select-text"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      "px-3 md:px-4 py-2",
                      (cell.column.id === "select" ||
                        cell.column.id === "actions" ||
                        cell.column.id === "category" ||
                        cell.column.id === "bank_account" ||
                        cell.column.id === "assigned" ||
                        cell.column.id === "method" ||
                        cell.column.id === "status") &&
                        "hidden md:table-cell",
                    )}
                    onClick={() => {
                      if (
                        cell.column.id !== "select" &&
                        cell.column.id !== "actions"
                      ) {
                        setOpen(row.id);
                      }
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {hasNextPage && (
        <div className="flex items-center justify-center mt-6" ref={ref}>
          <div className="flex items-center space-x-2 px-6 py-5">
            <Spinner />
            <span className="text-sm text-[#606060]">Loading more...</span>
          </div>
        </div>
      )}

      <TransactionSheet
        isOpen={Boolean(transactionId)}
        setOpen={setOpen}
        data={selectedTransaction}
        ids={data?.map(({ id }) => id)}
        updateTransaction={handleUpdateTransaction}
      />

      <BottomBar
        show={showBottomBar}
        count={pageMeta?.count}
        totalAmount={pageMeta?.totalAmount}
      />

      <ExportBar selected={selectedRows} />
    </div>
  );
}
