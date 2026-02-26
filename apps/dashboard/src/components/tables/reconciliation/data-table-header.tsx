"use client";

import { TableHead, TableHeader, TableRow } from "@midday/ui/table";
import { flexRender } from "@tanstack/react-table";
import type { Table } from "@tanstack/react-table";

type Props<T> = {
  table: Table<T>;
};

export function DataTableHeader<T>({ table }: Props<T>) {
  return (
    <TableHeader className="sticky top-0 z-10 bg-background">
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <TableHead
              key={header.id}
              style={{ width: header.getSize() }}
              className="text-xs font-medium text-muted-foreground"
            >
              {header.isPlaceholder
                ? null
                : flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  );
}
