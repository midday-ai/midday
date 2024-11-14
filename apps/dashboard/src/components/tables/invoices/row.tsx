"use client";

import { cn } from "@midday/ui/cn";
import { TableCell, TableRow } from "@midday/ui/table";
import { type Row, flexRender } from "@tanstack/react-table";
import type { Invoice } from "./columns";

type Props = {
  row: Row<Invoice>;
  setOpen: (id?: string) => void;
};

export function InvoiceRow({ row, setOpen }: Props) {
  return (
    <>
      <TableRow
        className="hover:bg-transparent cursor-default h-[57px] cursor-pointer"
        key={row.id}
      >
        {row.getVisibleCells().map((cell, index) => (
          <TableCell
            key={cell.id}
            className={cn(
              index === 2 && "w-[50px]",
              (cell.column.id === "actions" ||
                cell.column.id === "recurring" ||
                cell.column.id === "invoice_number" ||
                cell.column.id === "issue_date") &&
                "hidden md:table-cell",
            )}
            onClick={() =>
              index !== row.getVisibleCells().length - 1 && setOpen(row.id)
            }
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    </>
  );
}
