"use client";

import { TransactionSheet } from "@/components/sheets/transaction-sheet";
import { createClient } from "@midday/supabase/client";
import { Button } from "@midday/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect } from "react";
import { useState } from "react";
import { useInView } from "react-intersection-observer";
import { BottomBar } from "./bottom-bar";
import { DataTableHeader } from "./data-table-header";
import { ExportBar } from "./export-bar";

type Item = {
  id: string;
};

type ItemsProps = {
  data: Item[];
  teamId?: string;
  initialTransactionId: string;
};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data: initialData,
  teamId,
  initialTransactionId,
  pageSize,
  loadMore,
  meta,
  hasFilters,
  hasNextPage: initialHasNextPage,
  page,
}: DataTableProps<TData, TValue>) {
  const supabase = createClient();
  const router = useRouter();
  const [rowSelection, setRowSelection] = useState({});
  const [data, setData] = useState(initialData);
  const [from, setFrom] = useState(pageSize);
  const { ref, inView } = useInView();
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);

  const table = useReactTable({
    getRowId: (row) => row.id,
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  });

  const loadMoreData = async () => {
    const formatedFrom = from + 1;
    const to = formatedFrom + pageSize * 2;

    const { data, meta } = await loadMore({
      from: formatedFrom,
      to,
    });

    setData((prev) => [...prev, ...data]);
    setFrom(to);
    setHasNextPage(meta.count > to);
  };

  const [transactionId, setTransactionId] = useQueryState("id", {
    defaultValue: initialTransactionId,
    shallow: false,
  });

  const selectedTransaction = data.find(
    (transaction) => transaction.id === transactionId
  );

  const setOpen = (id: string | boolean) => {
    if (id) {
      setTransactionId(id);
    } else {
      setTransactionId(null);
    }
  };

  useEffect(() => {
    if (inView) {
      loadMoreData();
    }
  }, [inView]);

  useEffect(() => {
    const currentIndex = data.findIndex((row) => row.id === transactionId);

    const keyDownHandler = (evt: KeyboardEvent) => {
      if (transactionId && evt.key === "ArrowDown") {
        evt.preventDefault();
        const nextItem = data.at(currentIndex + 1);

        if (nextItem) {
          setTransactionId(nextItem.id);
        }
      }

      if (transactionId && evt.key === "Escape") {
        setTransactionId(null);
      }

      if (transactionId && evt.key === "ArrowUp") {
        evt.preventDefault();

        const prevItem = data.at(currentIndex - 1);

        if (currentIndex > 0 && prevItem) {
          setTransactionId(prevItem.id);
        }
      }
    };

    document.addEventListener("keydown", keyDownHandler);

    return () => {
      document.removeEventListener("keydown", keyDownHandler);
    };
  }, [transactionId, data, setTransactionId]);

  useEffect(() => {
    const channel = supabase
      .channel("realtime_transactions")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router, teamId]);

  return (
    <div className="rounded-md mb-8">
      <Table>
        <DataTableHeader table={table} />

        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="h-[45px]"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    onClick={() => {
                      if (cell.column.id !== "select") {
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
        <div className="flex items-center justify-center mt-8" ref={ref}>
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-[#606060]">Loading...</span>
          </div>
        </div>
      )}

      <TransactionSheet
        isOpen={Boolean(transactionId)}
        setOpen={setOpen}
        data={selectedTransaction}
        transactionId={transactionId}
      />

      {meta.count > 0 && (
        <BottomBar
          show={hasFilters && !table.getFilteredSelectedRowModel().rows.length}
          page={page}
          count={meta.count}
          hasNextPage={hasNextPage}
          totalAmount={meta.totalAmount}
          currency={meta.currency}
        />
      )}

      <ExportBar
        selected={table.getFilteredSelectedRowModel().rows.length}
        deselectAll={() => table.toggleAllPageRowsSelected(false)}
        transactionIds={Object.keys(rowSelection)}
      />
    </div>
  );
}
