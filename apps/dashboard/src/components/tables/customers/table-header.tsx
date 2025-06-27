"use client";

import { useSortParams } from "@/hooks/use-sort-params";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import {
  TableHeader as BaseTableHeader,
  TableHead,
  TableRow,
} from "@midday/ui/table";
import { ArrowDown, ArrowUp } from "lucide-react";

export function TableHeader() {
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
    <BaseTableHeader className="border-l-0 border-r-0">
      <TableRow>
        <TableHead className="w-[200px] min-w-[200px] sticky left-0 bg-background z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background after:z-[-1]">
          <Button
            className="p-0 hover:bg-transparent space-x-2"
            variant="ghost"
            onClick={() => createSortQuery("name")}
          >
            <span>Name</span>
            {"name" === column && value === "asc" && <ArrowDown size={16} />}
            {"name" === column && value === "desc" && <ArrowUp size={16} />}
          </Button>
        </TableHead>
        <TableHead className="w-[180px] min-w-[180px] hidden md:table-cell">
          <Button
            className="p-0 hover:bg-transparent space-x-2"
            variant="ghost"
            onClick={() => createSortQuery("contact")}
          >
            <span>Contact person</span>
            {"contact" === column && value === "asc" && <ArrowDown size={16} />}
            {"contact" === column && value === "desc" && <ArrowUp size={16} />}
          </Button>
        </TableHead>
        <TableHead className="hidden md:table-cell">
          <Button
            className="p-0 hover:bg-transparent space-x-2"
            variant="ghost"
            onClick={() => createSortQuery("email")}
          >
            <span>Email</span>
            {"email" === column && value === "asc" && <ArrowDown size={16} />}
            {"email" === column && value === "desc" && <ArrowUp size={16} />}
          </Button>
        </TableHead>
        <TableHead className="w-[200px] hidden md:table-cell">
          <Button
            className="p-0 hover:bg-transparent space-x-2"
            variant="ghost"
            onClick={() => createSortQuery("invoices")}
          >
            <span>Invoices</span>
            {"invoices" === column && value === "asc" && (
              <ArrowDown size={16} />
            )}
            {"invoices" === column && value === "desc" && <ArrowUp size={16} />}
          </Button>
        </TableHead>
        <TableHead className="hidden md:table-cell">
          <Button
            className="p-0 hover:bg-transparent space-x-2"
            variant="ghost"
            onClick={() => createSortQuery("projects")}
          >
            <span>Projects</span>
            {"projects" === column && value === "asc" && (
              <ArrowDown size={16} />
            )}
            {"projects" === column && value === "desc" && <ArrowUp size={16} />}
          </Button>
        </TableHead>

        <TableHead className="w-[280px] max-w-[280px] hidden md:table-cell">
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
    </BaseTableHeader>
  );
}
