"use client";

import { Checkbox } from "@midday/ui/checkbox";
import { TableHead, TableHeader, TableRow } from "@midday/ui/table";

interface TableColumn {
  id: string;
  getIsVisible: () => boolean;
}

interface TableInterface {
  getAllLeafColumns: () => TableColumn[];
  getIsAllPageRowsSelected: () => boolean;
  getIsSomePageRowsSelected: () => boolean;
  toggleAllPageRowsSelected: (value: boolean) => void;
}

interface Props {
  table?: TableInterface;
}

export function DataTableHeader({ table }: Props) {
  return (
    <TableHeader>
      <TableRow className="h-[45px] hover:bg-transparent">
        <TableHead className="w-[50px] min-w-[50px] px-3 md:px-4 py-2">
          <Checkbox
            checked={
              table?.getIsAllPageRowsSelected() ||
              (table?.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table?.toggleAllPageRowsSelected(!!value)
            }
          />
        </TableHead>

        <TableHead className="w-2/5 min-w-[400px] px-3 py-2">
          <span>Name</span>
        </TableHead>

        <TableHead className="w-[400px] px-3 py-2">
          <span>Tags</span>
        </TableHead>

        <TableHead className="px-3 md:px-4 py-2 w-[100px] min-w-[100px]">
          <span>Size</span>
        </TableHead>

        <TableHead className="px-3 md:px-4 py-2 text-right w-[100px]">
          <span>Actions</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
