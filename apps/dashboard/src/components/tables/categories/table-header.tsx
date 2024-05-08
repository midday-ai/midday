"use client";

import { AlertDialogTrigger } from "@midday/ui/alert-dialog";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import type { Table } from "@tanstack/react-table";
import type { Category } from "./columns";

type Props = {
  table?: Table<Category[]>;
  onOpenChange?: (isOpen: boolean) => void;
  selectedIds?: string[];
};

export function TableHeader({ table, onOpenChange, selectedIds }: Props) {
  return (
    <div className="flex items-center py-4 justify-between">
      <Input
        placeholder="Search..."
        value={(table?.getColumn("name")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table?.getColumn("name")?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
      />
      {selectedIds?.length ? (
        <div className="flex items-center">
          <span className="text-sm text-[#606060] w-full">Bulk delete</span>
          <div className="h-8 w-[1px] bg-border ml-4 mr-4" />

          <div>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-8 border-[#FF3638] hover:border-[#FF3638]"
              >
                <Icons.Delete size={18} className="text-[#FF3638]" />
              </Button>
            </AlertDialogTrigger>
          </div>
        </div>
      ) : (
        <Button onClick={() => onOpenChange?.(true)}>Create</Button>
      )}
    </div>
  );
}
