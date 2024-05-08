"use client";

import { EditCategoryModal } from "@/components/modals/edit-category-modal";
import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

export type Category = {
  id: string;
  name: string;
  color: string;
};

export const columns: ColumnDef<Category>[] = [
  {
    id: "select",
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
  },
  {
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="flex space-x-2 items-center">
        <div
          className="size-3 transition-colors rounded-[2px]"
          style={{ backgroundColor: row.original.color }}
        />
        <span>{row.getValue("name")}</span>
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const [isOpen, setOpen] = React.useState(false);

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setOpen(true)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  table.options.meta?.deleteCategories.execute({
                    ids: [row.original.id],
                    revalidatePath: "/settings/categories",
                  })
                }
              >
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <EditCategoryModal
            id={row.id}
            defaultValue={row.original}
            isOpen={isOpen}
            onOpenChange={setOpen}
          />
        </div>
      );
    },
  },
];
