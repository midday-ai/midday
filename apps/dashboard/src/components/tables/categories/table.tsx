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
  AlertDialogTrigger,
} from "@midday/ui/alert-dialog";
import { cn } from "@midday/ui/cn";
import { Dialog } from "@midday/ui/dialog";
import { Table, TableBody, TableCell, TableRow } from "@midday/ui/table";
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
import { TableHeader } from "./table-header";

type Props = {
  data: Category[];
};

export function DataTable({ data }: Props) {
  const [rowSelection, setRowSelection] = React.useState({});
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
    onRowSelectionChange: setRowSelection,
    meta: {
      deleteCategories,
    },
    state: {
      rowSelection,
    },
  });

  const selectedIds = table
    ?.getFilteredSelectedRowModel()
    .rows.map(({ id }) => id);

  return (
    <AlertDialog>
      <div className="w-full">
        <TableHeader
          table={table}
          selectedIds={selectedIds}
          onOpenChange={onOpenChange}
        />

        <Table>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className="hover:bg-transparent"
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell, index) => (
                    <TableCell
                      key={cell.id}
                      className={cn((index === 0 || index === 2) && "w-[50px]")}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-[360px] text-center"
                >
                  <h2 className="mb-1 font-medium">No Categories Found</h2>
                  <span className="text-[#606060]">
                    Use the button above to create categories.
                  </span>
                </TableCell>
              </TableRow>
            )}
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
