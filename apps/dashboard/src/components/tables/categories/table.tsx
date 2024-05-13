"use client";

import { deleteCategoriesAction } from "@/actions/delete-categories-action";
import { CreateCategoriesModal } from "@/components/modals/create-categories-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@midday/ui/alert-dialog";
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
import { useToast } from "@midday/ui/use-toast";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useAction } from "next-safe-action/hooks";
import React from "react";
import { type Category, columns } from "./columns";
import { Header } from "./header";

type Props = {
  data: Category[];
};

export function DataTable({ data }: Props) {
  const [isOpen, onOpenChange] = React.useState(false);
  const { toast } = useToast();

  const deleteCategories = useAction(deleteCategoriesAction, {
    onSuccess: ({ data }) => {
      toast({
        title:
          data && data?.length > 1 ? "Categories removed." : "Category removed",
        duration: 3500,
        variant: "success",
      });
    },
  });

  const table = useReactTable({
    data,
    getRowId: ({ id }) => id,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      deleteCategories,
    },
  });

  return (
    <AlertDialog>
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
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                className="hover:bg-transparent"
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
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

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            categories and mark assigned transactions to Uncategorized.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              deleteCategories.execute({
                ids: selectedIds,
                revalidatePath: "/settings/categories",
              })
            }
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
