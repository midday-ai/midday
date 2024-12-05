"use client";

import { cn } from "@midday/ui/cn";
import { TableCell, TableRow } from "@midday/ui/table";
import { type Row, flexRender } from "@tanstack/react-table";
import type { Customer } from "./columns";

type Props = {
  row: Row<Customer>;
  setOpen: (id?: string) => void;
};

export function CustomerRow({ row, setOpen }: Props) {
  return (
    <>
      <TableRow
        className="hover:bg-transparent cursor-default h-[45px] cursor-pointer"
        key={row.id}
      >
        {row.getVisibleCells().map((cell, index) => (
          <TableCell
            key={cell.id}
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
