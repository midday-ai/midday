"use client";

import { Skeleton } from "@midday/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@midday/ui/table";
import { DataTableHeader } from "./data-table-header";

const data = [...Array(10)].map((_, i) => ({ id: i.toString() }));

export function DataTableSkeleton() {
  return (
    <Table>
      <DataTableHeader />

      <TableBody>
        {data?.map((row) => (
          <TableRow key={row.id} className="h-[45px]">
            {/* Checkbox column */}
            <TableCell className="w-[50px] min-w-[50px] px-3 md:px-4 py-2">
              <Skeleton className="h-4 w-4" />
            </TableCell>
            {/* Name column */}
            <TableCell className="w-2/5 min-w-[400px] px-3 py-2">
              <Skeleton className="h-3.5 w-[60%]" />
            </TableCell>
            {/* Tags column */}
            <TableCell className="w-[400px] px-3 py-2">
              <Skeleton className="h-3.5 w-[70%]" />
            </TableCell>
            {/* Size column */}
            <TableCell className="w-[100px] min-w-[100px] px-3 md:px-4 py-2">
              <Skeleton className="h-3.5 w-[50%]" />
            </TableCell>
            {/* Actions column */}
            <TableCell className="w-[100px] px-3 md:px-4 py-2 text-right">
              <Skeleton className="h-3.5 w-[50%]" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
