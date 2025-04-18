"use client";

import { useSortParams } from "@/hooks/use-sort-params";
import { Button } from "@midday/ui/button";
import { TableHead, TableHeader, TableRow } from "@midday/ui/table";
import { ArrowDown, ArrowUp } from "lucide-react";

export function DataTableHeader() {
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
    <TableHeader>
      <TableRow className="h-[45px]">
        <TableHead className="w-[320px]">
          <Button
            className="p-0 hover:bg-transparent space-x-2"
            variant="ghost"
            onClick={() => createSortQuery("name")}
          >
            <span>Project</span>
            {"name" === column && value === "asc" && <ArrowDown size={16} />}
            {"name" === column && value === "desc" && <ArrowUp size={16} />}
          </Button>
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

        <TableHead className="w-[180px]">
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
        <TableHead className="w-[190px]">
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
        <TableHead className="w-[330px]">
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
        <TableHead className="w-[170px]">
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
      </TableRow>
    </TableHeader>
  );
}
