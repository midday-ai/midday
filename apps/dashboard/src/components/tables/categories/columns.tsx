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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

export type Category = {
  id: string;
  name: string;
  system: boolean;
  vat?: string;
  color: string;
};

export const columns: ColumnDef<Category>[] = [
  {
    header: "Name",
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="flex space-x-2 items-center">
        <div
          className="size-3"
          style={{ backgroundColor: row.original.color }}
        />
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-default">{row.getValue("name")}</span>
            </TooltipTrigger>
            {row.original?.description && (
              <TooltipContent
                className="px-3 py-1.5 text-xs"
                side="right"
                sideOffset={10}
              >
                {row.original.description}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {row.original.system && (
          <div className="pl-2">
            <span className="border border-border rounded-full py-1.5 px-3 text-xs text-[#878787] font-mono">
              System
            </span>
          </div>
        )}
      </div>
    ),
  },
  {
    header: "VAT",
    accessorKey: "vat",
    cell: ({ row }) => (row.getValue("vat") ? `${row.getValue("vat")}%` : "-"),
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
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setOpen(true)}>
                Edit
              </DropdownMenuItem>
              {!row.original.system && (
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
              )}
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
