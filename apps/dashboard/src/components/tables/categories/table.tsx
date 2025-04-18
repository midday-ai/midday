"use client";

import { CreateCategoriesModal } from "@/components/modals/create-categories-modal";
import { useTRPC } from "@/trpc/client";
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
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";
import { columns } from "./columns";
import { Header } from "./header";

export function DataTable() {
  const [isOpen, onOpenChange] = React.useState(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data } = useSuspenseQuery(
    trpc.transactionCategories.get.queryOptions(),
  );

  const deleteCategoryMutation = useMutation(
    trpc.transactionCategories.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactionCategories.get.queryKey(),
        });
      },
    }),
  );

  const table = useReactTable({
    data: data ?? [],
    getRowId: ({ id }) => id,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      deleteCategory: (id: string) => {
        deleteCategoryMutation.mutate({ id });
      },
    },
  });

  return (
    <div className="w-full">
      <Header table={table} onOpenChange={onOpenChange} />

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
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
            <TableRow className="hover:bg-transparent" key={row.id}>
              {row.getVisibleCells().map((cell, index) => (
                <TableCell
                  key={cell.id}
                  className={cn(index === 2 && "w-[50px]")}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <CreateCategoriesModal onOpenChange={onOpenChange} isOpen={isOpen} />
      </Dialog>
    </div>
  );
}
