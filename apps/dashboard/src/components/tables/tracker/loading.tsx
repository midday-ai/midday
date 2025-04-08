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
            <TableCell className="w-[320px]">
              <Skeleton className="h-3.5 w-[60%]" />
            </TableCell>
            <TableCell className="w-[180px]">
              <Skeleton className="h-3.5 w-[50%]" />
            </TableCell>
            <TableCell className="w-[180px]">
              <Skeleton className="h-3.5 w-[40%]" />
            </TableCell>
            <TableCell className="w-[190px]">
              <Skeleton className="h-3.5 w-[50%]" />
            </TableCell>
            <TableCell className="w-[330px]">
              <Skeleton className="h-3.5 w-[70%]" />
            </TableCell>
            <TableCell className="min-w-[170px]">
              <Skeleton className="h-3.5 w-[60%]" />
            </TableCell>
            <TableCell className="w-[140px]">
              <Skeleton className="h-3.5 w-[50%]" />
            </TableCell>
            <TableCell className="w-[170px]">
              <Skeleton className="h-3.5 w-[40%]" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
