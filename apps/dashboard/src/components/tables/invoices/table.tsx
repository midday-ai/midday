"use client";

import { Table, TableBody } from "@midday/ui/table";
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";
import { type Invoice, columns } from "./columns";
import { InvoiceRow } from "./row";
import { TableHeader } from "./table-header";

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
      <TableHeader />

      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <InvoiceRow key={row.id} row={row} />
        ))}
      </TableBody>
    </Table>
  );
}
