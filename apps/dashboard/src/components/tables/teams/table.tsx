"use client";

import { useTRPC } from "@/trpc/client";
import { cn } from "@midday/ui/cn";
import { Table, TableBody, TableCell, TableRow } from "@midday/ui/table";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnFiltersState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";
import { useState } from "react";
import { columns } from "./columns";
import { DataTableHeader } from "./table-header";

export function DataTable() {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.team.list.queryOptions());

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    state: {
      columnFilters,
    },
  });

  return (
    <div className="w-full">
      <DataTableHeader table={table} />
      <Table>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="hover:bg-transparent"
              >
                {row.getAllCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      "border-r-[0px] py-4",
                      cell.column.columnDef.meta?.className,
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
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
