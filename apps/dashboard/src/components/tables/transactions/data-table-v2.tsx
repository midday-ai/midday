"use client";

import { useSortParams } from "@/hooks/use-sort-params";
import { useTransactionFilterParams } from "@/hooks/use-transaction-filter-params";
import { useUserContext } from "@/store/user/hook";
import { useTRPC } from "@/trpc/client";
import { Table, TableBody, TableCell, TableRow } from "@midday/ui/table";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useDeferredValue, useMemo } from "react";
import { columns } from "./columns";
import { DataTableHeader } from "./data-table-header";

export function DataTableV2() {
  const { team_id } = useUserContext((state) => state.data);
  const { filter } = useTransactionFilterParams();
  const deferredSearch = useDeferredValue(filter.q);
  const { params } = useSortParams();

  const trpc = useTRPC();

  const infiniteQueryOptions =
    trpc.transactions.getTransactions.infiniteQueryOptions(
      {
        teamId: team_id,
        // filter: {
        //   ...filter,
        //   q: deferredSearch,
        // },
        sort: params.sort,
      },
      {
        getNextPageParam: (lastPage, pages) => lastPage.meta.count,
      },
    );

  const { data } = useSuspenseInfiniteQuery(infiniteQueryOptions);

  const tableData = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  const table = useReactTable({
    getRowId: (row) => row.id,
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // onRowSelectionChange: setRowSelection,
    // onColumnVisibilityChange: setColumnVisibility,
    // meta: {
    //   setOpen,
    //   copyUrl: handleCopyUrl,
    //   updateTransaction: handleUpdateTransaction,
    //   deleteTransactions: handleDeleteTransactions,
    //   dateFormat,
    //   hasSorting,
    // },
    // state: {
    //   rowSelection,
    //   columnVisibility,
    // },
  });

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
                    onClick={() => {
                      if (
                        cell.column.id !== "select" &&
                        cell.column.id !== "actions"
                      ) {
                        // setOpen(row.id);
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
    </div>
  );
}
