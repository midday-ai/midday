"use client";
import { Skeleton } from "@midday/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@midday/ui/table";
import { DataTableHeader } from "./data-table-header";

const data = [...Array(10)].map((_, i) => ({ id: i.toString() }));

export function Loading() {
  return (
    <Table>
      <DataTableHeader />

      <TableBody>
        {data?.map((row) => (
          <TableRow key={row.id} className="h-[45px]">
            <TableCell className="w-[440px]">
              <Skeleton className="h-3.5 w-[305px]" />
            </TableCell>

            <TableCell className="w-[140px]">
              <Skeleton className="h-3.5 w-[60%]" />
            </TableCell>
            <TableCell className="w-[430px]">
              <Skeleton className="h-3.5 w-[50%]" />
            </TableCell>

            <TableCell>
              <Skeleton className="h-3.5 w-[50%]" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
