"use client";

import { CreateApiKeyModal } from "@/components/modals/create-api-key-modal";
import { useTokenModalStore } from "@/store/token-modal";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Dialog } from "@midday/ui/dialog";
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
import { useState } from "react";
import { columns } from "./columns";
import { EmptyState } from "./empty-state";

export function DataTable() {
  const trpc = useTRPC();
  const [isOpen, onOpenChange] = useState(false);
  const { setData } = useTokenModalStore();
  const { data } = useSuspenseQuery({
    ...trpc.apiKeys.get.queryOptions(),
  });

  const table = useReactTable({
    getRowId: (row) => row.id,
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center pb-4 gap-4 md:gap-8">
        <div className="flex-1">
          <h3 className="text-lg font-medium leading-none tracking-tight mb-2">
            API Keys
          </h3>
          <p className="text-sm text-[#606060]">
            These API keys allow other apps to access your team. Use it with
            caution – do not share your API key with others, or expose it in the
            browser or other client-side code.
          </p>
        </div>
        <div className="flex-shrink-0">
          <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <Button onClick={() => onOpenChange(true)}>Create API Key</Button>
            <CreateApiKeyModal onOpenChange={onOpenChange} />
          </Dialog>
        </div>
      </div>
      {data.length > 0 ? (
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
                        setData(row.original, "edit");
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
