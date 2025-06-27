"use client";

import { HorizontalPagination } from "@/components/horizontal-pagination";
import { Checkbox } from "@midday/ui/checkbox";
import { cn } from "@midday/ui/cn";
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
  tableScroll?: {
    canScrollLeft: boolean;
    canScrollRight: boolean;
    isScrollable: boolean;
    scrollLeft: () => void;
    scrollRight: () => void;
  };
}

export function DataTableHeader({ table, tableScroll }: Props) {
  return (
    <TableHeader className="border-l-0 border-r-0">
      <TableRow className="h-[45px] hover:bg-transparent">
        <TableHead className="w-[50px] min-w-[50px] px-3 md:px-4 py-2 sticky left-0 bg-background z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background after:z-[-1]">
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

        <TableHead className="w-[250px] min-w-[250px] px-3 py-2 sticky left-[50px] bg-background z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background after:z-[-1]">
          <div className="flex items-center justify-between">
            <span>Name</span>
            {tableScroll?.isScrollable && (
              <HorizontalPagination
                canScrollLeft={tableScroll.canScrollLeft}
                canScrollRight={tableScroll.canScrollRight}
                onScrollLeft={tableScroll.scrollLeft}
                onScrollRight={tableScroll.scrollRight}
                className="ml-auto"
              />
            )}
          </div>
        </TableHead>

        <TableHead className="w-[280px] max-w-[280px] px-3 py-2">
          <span>Tags</span>
        </TableHead>

        <TableHead className="px-3 md:px-4 py-2 w-[100px] min-w-[100px]">
          <span>Size</span>
        </TableHead>

        <TableHead
          className={cn(
            "px-3 md:px-4 py-2 text-right w-[100px] sticky right-0 bg-background z-30",
            "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-border",
            "after:absolute after:left-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-r after:from-transparent after:to-background after:z-[-1]",
          )}
        >
          <span>Actions</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
