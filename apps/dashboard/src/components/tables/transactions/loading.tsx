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
              <TableRow key={row.id} className="h-[45px] flex items-center">
                {/* Select column - always visible */}
                <TableCell className="w-[50px] min-w-[50px]">
                  <Skeleton className="h-3.5 w-[15px]" />
                </TableCell>

                {/* Date column - always visible */}
                <TableCell className="w-[110px] min-w-[110px]">
                  <Skeleton className="h-3.5 w-16" />
                </TableCell>

                {/* Description column - always visible */}
                <TableCell className="w-[320px] min-w-[320px]">
                  <Skeleton className="h-3.5 w-40" />
                </TableCell>

                {/* Amount column */}
                <TableCell className="w-[170px] min-w-[170px]">
                  <Skeleton className="h-3.5 w-20" />
                </TableCell>

                {/* Tax Amount column */}
                <TableCell className="w-[170px] min-w-[170px]">
                  <Skeleton className="h-3.5 w-24" />
                </TableCell>

                {/* Category column */}
                <TableCell className="w-[250px] min-w-[250px]">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-3.5 w-28" />
                  </div>
                </TableCell>

                {/* Counterparty column */}
                <TableCell className="w-[200px] min-w-[200px]">
                  <Skeleton className="h-3.5 w-28" />
                </TableCell>

                {/* Tags column */}
                <TableCell className="w-[280px] max-w-[280px]">
                  <div className="flex items-center space-x-1">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </TableCell>

                {/* Bank Account column */}
                <TableCell className="w-[250px]">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-3.5 w-32" />
                  </div>
                </TableCell>

                {/* Method column */}
                <TableCell className="w-[140px] min-w-[140px]">
                  <Skeleton className="h-3.5 w-16" />
                </TableCell>

                {/* Assigned column */}
                <TableCell className="w-[220px] min-w-[220px]">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-3.5 w-24" />
                  </div>
                </TableCell>

                {/* Status column */}
                <TableCell className="w-[140px]">
                  <Skeleton className="h-5 w-20" />
                </TableCell>

                {/* Actions column - always visible */}
                <TableCell className="w-[100px]">
                  <Skeleton className="h-5 w-5" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
