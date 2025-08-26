"use client";

import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@midday/ui/table";
import { DataTableHeader } from "./data-table-header";

const data = [...Array(40)].map((_, i) => ({ id: i.toString() }));

export function Loading({ isEmpty }: { isEmpty?: boolean }) {
  return (
    <div className="w-full">
      <div
        className={cn(
          "overflow-x-auto",
          !isEmpty && "md:border-l md:border-r border-border",
        )}
      >
        <Table
          className={cn(
            "min-w-[1600px]",
            isEmpty && "opacity-20 pointer-events-none blur-[7px]",
          )}
        >
          <DataTableHeader loading />

          <TableBody className="border-l-0 border-r-0 border-t-0 border-b-0">
            {data?.map((row) => (
              <TableRow key={row.id} className="h-[45px]">
                <TableCell className="w-[50px]">
                  <Skeleton className="h-3.5 w-[15px]" />
                </TableCell>

                <TableCell className="w-[100px]">
                  <Skeleton className="h-3.5 w-[60%]" />
                </TableCell>
                <TableCell className="w-[430px]">
                  <Skeleton className="h-3.5 w-[50%]" />
                </TableCell>
                <TableCell className="w-[200px]">
                  <Skeleton className="h-3.5 w-[50%]" />
                </TableCell>

                <TableCell className="w-[200px]">
                  <Skeleton className="h-3.5 w-[60%]" />
                </TableCell>
                <TableCell className="w-[150px]">
                  <Skeleton className="h-3.5 w-[80px]" />
                </TableCell>
                <TableCell className="w-[200px]">
                  <div className="flex items-center space-x-2 w-[80%]">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-3.5 w-[70%]" />
                  </div>
                </TableCell>
                <TableCell className="w-50px">
                  <Skeleton className="h-[20px] w-[20px] rounded-full" />
                </TableCell>
                <TableCell className="w-60px" />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
