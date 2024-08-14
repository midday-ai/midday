"use client";
import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@midday/ui/table";
import { DataTableHeader } from "./data-table-header";

const data = [...Array(40)].map((_, i) => ({ id: i.toString() }));

export function Loading({ isEmpty }: { isEmpty?: boolean }) {
  return (
    <Table
      className={cn(isEmpty && "opacity-20 pointer-events-none blur-[7px]")}
    >
      <DataTableHeader loading />

      <TableBody>
        {data?.map((row) => (
          <TableRow key={row.id} className="h-[45px]">
            <TableCell className="w-[50px]">
              <Skeleton
                className={cn("h-3.5 w-[15px]", isEmpty && "animate-none")}
              />
            </TableCell>

            <TableCell className="w-[100px]">
              <Skeleton
                className={cn("h-3.5 w-[60%]", isEmpty && "animate-none")}
              />
            </TableCell>
            <TableCell className="w-[430px]">
              <Skeleton
                className={cn("h-3.5 w-[50%]", isEmpty && "animate-none")}
              />
            </TableCell>
            <TableCell className="w-[200px]">
              <Skeleton
                className={cn("h-3.5 w-[50%]", isEmpty && "animate-none")}
              />
            </TableCell>

            <TableCell className="w-[200px]">
              <Skeleton
                className={cn("h-3.5 w-[60%]", isEmpty && "animate-none")}
              />
            </TableCell>
            <TableCell className="w-[150px]">
              <Skeleton
                className={cn("h-3.5 w-[80px]", isEmpty && "animate-none")}
              />
            </TableCell>
            <TableCell className="w-[200px]">
              <div className="flex items-center space-x-2 w-[80%]">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton
                  className={cn("h-3.5 w-[70%]", isEmpty && "animate-none")}
                />
              </div>
            </TableCell>
            <TableCell className="w-50px">
              <Skeleton
                className={cn(
                  "h-[20px] w-[20px] rounded-full",
                  isEmpty && "animate-none",
                )}
              />
            </TableCell>
            <TableCell className="w-60px" />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
