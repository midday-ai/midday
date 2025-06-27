"use client";

import { HorizontalPagination } from "@/components/horizontal-pagination";
import { useSortParams } from "@/hooks/use-sort-params";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { TableHead, TableHeader, TableRow } from "@midday/ui/table";
import { ArrowDown, ArrowUp } from "lucide-react";

interface Props {
  tableScroll?: {
    canScrollLeft: boolean;
    canScrollRight: boolean;
    isScrollable: boolean;
    scrollLeft: () => void;
    scrollRight: () => void;
  };
}

export function DataTableHeader({ tableScroll }: Props) {
  const { params, setParams } = useSortParams();

  const [column, value] = params.sort || [];

  const createSortQuery = (name: string) => {
    const [currentColumn, currentValue] = params.sort || [];

    if (name === currentColumn) {
      if (currentValue === "asc") {
        setParams({ sort: [name, "desc"] });
      } else if (currentValue === "desc") {
        setParams({ sort: null });
      } else {
        setParams({ sort: [name, "asc"] });
      }
    } else {
      setParams({ sort: [name, "asc"] });
    }
  };

  return (
    <TableHeader className="border-l-0 border-r-0">
      <TableRow className="h-[45px]">
        <TableHead className="w-[240px] min-w-[240px] sticky left-0 bg-background z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background after:z-[-1]">
          <div className="flex items-center justify-between">
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("name")}
            >
              <span>Project</span>
              {"name" === column && value === "asc" && <ArrowDown size={16} />}
              {"name" === column && value === "desc" && <ArrowUp size={16} />}
            </Button>
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
        <TableHead className="w-[180px]">
          <Button
            className="p-0 hover:bg-transparent space-x-2"
            variant="ghost"
            onClick={() => createSortQuery("customer")}
          >
            <span>Customer</span>
            {"customer" === column && value === "asc" && (
              <ArrowDown size={16} />
            )}
            {"customer" === column && value === "desc" && <ArrowUp size={16} />}
          </Button>
        </TableHead>

        <TableHead className="w-[180px] min-w-[180px]">
          <Button
            className="p-0 hover:bg-transparent space-x-2"
            variant="ghost"
            onClick={() => createSortQuery("time")}
          >
            <span>Total Time</span>
            {"time" === column && value === "asc" && <ArrowDown size={16} />}
            {"time" === column && value === "desc" && <ArrowUp size={16} />}
          </Button>
        </TableHead>
        <TableHead className="w-[190px] min-w-[190px]">
          <Button
            className="p-0 hover:bg-transparent space-x-2"
            variant="ghost"
            onClick={() => createSortQuery("amount")}
          >
            <span>Total Amount</span>
            {"amount" === column && value === "asc" && <ArrowDown size={16} />}
            {"amount" === column && value === "desc" && <ArrowUp size={16} />}
          </Button>
        </TableHead>
        <TableHead className="w-[200px] min-w-[200px]">
          <Button
            className="p-0 hover:bg-transparent space-x-2"
            variant="ghost"
            onClick={() => createSortQuery("description")}
          >
            <span className="line-clamp-1 text-ellipsis">Description</span>
            {"description" === column && value === "asc" && (
              <ArrowDown size={16} />
            )}
            {"description" === column && value === "desc" && (
              <ArrowUp size={16} />
            )}
          </Button>
        </TableHead>

        <TableHead className="min-w-[170px]">
          <Button
            className="p-0 hover:bg-transparent space-x-2"
            variant="ghost"
            onClick={() => createSortQuery("tags")}
          >
            <span>Tags</span>
            {"tags" === column && value === "asc" && <ArrowDown size={16} />}
            {"tags" === column && value === "desc" && <ArrowUp size={16} />}
          </Button>
        </TableHead>

        <TableHead className="w-[140px]">
          <Button
            className="p-0 hover:bg-transparent space-x-2"
            variant="ghost"
            onClick={() => createSortQuery("assigned")}
          >
            <span>Assigned</span>
            {"assigned" === column && value === "asc" && (
              <ArrowDown size={16} />
            )}
            {"assigned" === column && value === "desc" && <ArrowUp size={16} />}
          </Button>
        </TableHead>
        <TableHead className="w-[150px] min-w-[150px]">
          <Button
            className="p-0 hover:bg-transparent space-x-2"
            variant="ghost"
            onClick={() => createSortQuery("status")}
          >
            <span>Status</span>
            {"status" === column && value === "asc" && <ArrowDown size={16} />}
            {"status" === column && value === "desc" && <ArrowUp size={16} />}
          </Button>
        </TableHead>
        <TableHead
          className={cn(
            "w-[100px] sticky right-0 bg-background z-30",
            "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-border",
            "after:absolute after:left-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-r after:from-transparent after:to-background after:z-[-1]",
          )}
        >
          Actions
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
