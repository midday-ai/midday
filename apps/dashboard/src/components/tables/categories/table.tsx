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
import { columns, flattenCategories } from "./columns";
import { Header } from "./header";

export function DataTable() {
  const [isOpen, onOpenChange] = React.useState(false);
  const [expandedCategories, setExpandedCategories] = React.useState<
    Set<string>
  >(new Set());

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

  // Flatten categories and filter based on expanded state
  const flattenedData = React.useMemo(() => {
    const flattened = flattenCategories(data ?? []);

    // Filter to only show parent categories and children of expanded parents
    return flattened.filter((category) => {
      // Always show parent categories
      if (!category.isChild) {
        return true;
      }
      // Only show children if their parent is expanded
      return category.parentId && expandedCategories.has(category.parentId);
    });
  }, [data, expandedCategories]);

  const table = useReactTable({
    data: flattenedData,
    getRowId: ({ id }) => id,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      deleteCategory: (id: string) => {
        deleteCategoryMutation.mutate({ id });
      },
      expandedCategories,
      setExpandedCategories,
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
                  className={cn(index === 3 && "w-[50px]")}
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
