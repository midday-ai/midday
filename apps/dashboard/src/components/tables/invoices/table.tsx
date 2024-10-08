"use client";

import { cn } from "@midday/ui/cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";
import { type Invoice, columns } from "./columns";
import { InvoiceRow } from "./row";

type Props = {
  data: Invoice[];
};

export function DataTable({ data }: Props) {
  const table = useReactTable({
    data,
    getRowId: ({ id }) => id,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <InvoiceRow key={row.id} row={row} />
        ))}
      </TableBody>
    </Table>
  );
}
