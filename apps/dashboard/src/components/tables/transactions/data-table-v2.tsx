"use client";

import { useUserContext } from "@/store/user/hook";
import { getTransactions } from "@midday/query/queries";
import { createClient } from "@midday/supabase/client";
import { cn } from "@midday/ui/cn";
import { Table, TableBody, TableCell, TableRow } from "@midday/ui/table";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { columns } from "./columns";
import { DataTableHeader } from "./data-table-header";

export function DataTableV2() {
  const { team_id } = useUserContext((state) => state.data);

  const supabase = createClient();
  const { data, isLoading, error } = useSuspenseQuery({
    queryKey: ["transactions"],
    queryFn: () =>
      getTransactions(supabase, {
        teamId: "dd6a039e-d071-423a-9a4d-9ba71325d890",
        to: 10,
        from: 0,
      }),
  });

  console.log(data, isLoading, error);

  return null;

  // const { data, isLoading, error } = useTransactionsInfiniteQuery({
  //   teamId: team_id,
  //   to: 10,
  //   from: 0,
  // });

  // const table = useReactTable({
  //   getRowId: (row) => row.id,
  //   data,
  //   columns,
  //   getCoreRowModel: getCoreRowModel(),
  //   // onRowSelectionChange: setRowSelection,
  //   // onColumnVisibilityChange: setColumnVisibility,
  //   // meta: {
  //   //   setOpen,
  //   //   copyUrl: handleCopyUrl,
  //   //   updateTransaction: handleUpdateTransaction,
  //   //   deleteTransactions: handleDeleteTransactions,
  //   //   dateFormat,
  //   //   hasSorting,
  //   // },
  //   // state: {
  //   //   rowSelection,
  //   //   columnVisibility,
  //   // },
  // });

  return (
    <div className="mb-8 relative">
      <Table>
        {/* <DataTableHeader table={table} /> */}

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
                    // className={cn(
                    //   "px-3 md:px-4 py-2",
                    //   (cell.column.id === "select" ||
                    //     cell.column.id === "actions" ||
                    //     cell.column.id === "category" ||
                    //     cell.column.id === "bank_account" ||
                    //     cell.column.id === "assigned" ||
                    //     cell.column.id === "method" ||
                    //     cell.column.id === "status") &&
                    //     "hidden md:table-cell",
                    // )}
                    // onClick={() => {
                    //   if (
                    //     cell.column.id !== "select" &&
                    //     cell.column.id !== "actions"
                    //   ) {
                    //     setOpen(row.id);
                    //   }
                    // }}
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
