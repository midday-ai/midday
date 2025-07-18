"use client";

import { useOAuthApplicationParams } from "@/hooks/use-oauth-application-params";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";
import { columns } from "./columns";
import { EmptyState } from "./empty-state";

export function OAuthDataTable() {
  const trpc = useTRPC();
  const { setParams } = useOAuthApplicationParams();
  const { data } = useSuspenseQuery({
    ...trpc.oauthApplications.list.queryOptions(),
  });

  const applications = data?.data ?? [];

  const table = useReactTable({
    getRowId: (row) => row.id,
    data: applications,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center pb-4 gap-4 md:gap-8">
        <div className="flex-1">
          <h3 className="text-lg font-medium leading-none tracking-tight mb-2">
            OAuth Applications
          </h3>
          <p className="text-sm text-[#606060]">
            These OAuth applications allow other apps to access your team data
            on behalf of users. Manage client credentials and permissions
            carefully.
          </p>
        </div>
        <div className="flex-shrink-0">
          <Button onClick={() => setParams({ createApplication: true })}>
            Create OAuth App
          </Button>
        </div>
      </div>
      {applications.length > 0 ? (
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={header.column.columnDef.meta?.className}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-transparent">
                {row.getAllCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    onClick={() => {
                      if (cell.column.id !== "actions") {
                        setParams({
                          applicationId: row.original.id,
                          editApplication: true,
                        });
                      }
                    }}
                    className={cn(
                      "border-r-[0px] py-4 cursor-pointer",
                      cell.column.columnDef.meta?.className,
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
