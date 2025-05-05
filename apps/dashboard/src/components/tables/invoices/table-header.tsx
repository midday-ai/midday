"use client";

import { useSortParams } from "@/hooks/use-sort-params";
import { Button } from "@midday/ui/button";
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
    <BaseTableHeader>
      <TableRow>
        <TableHead className="w-[200px]">
          <Button
            className="p-0 hover:bg-transparent space-x-2"
            variant="ghost"
            onClick={() => createSortQuery("invoice_number")}
          >
            <span>Invoice no.</span>
            {"invoice_number" === column && value === "asc" && (
              <ArrowDown size={16} />
            )}
            {"invoice_number" === column && value === "desc" && (
              <ArrowUp size={16} />
            )}
          </Button>
        </TableHead>
        <TableHead className="w-[150px]">
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
        <TableHead className="w-[180px]">
          <Button
            className="p-0 hover:bg-transparent space-x-2"
            variant="ghost"
            onClick={() => createSortQuery("due_date")}
          >
            <span>Due Date</span>
            {"due_date" === column && value === "asc" && (
              <ArrowDown size={16} />
            )}
            {"due_date" === column && value === "desc" && <ArrowUp size={16} />}
          </Button>
        </TableHead>
        <TableHead className="min-w-[250px]">
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
        <TableHead className="w-[200px]">
          <Button
            className="p-0 hover:bg-transparent space-x-2"
            variant="ghost"
            onClick={() => createSortQuery("amount")}
          >
            <span>Amount</span>
            {"amount" === column && value === "asc" && <ArrowDown size={16} />}
            {"amount" === column && value === "desc" && <ArrowUp size={16} />}
          </Button>
        </TableHead>

        <TableHead>
          <Button
            className="p-0 hover:bg-transparent space-x-2"
            variant="ghost"
            onClick={() => createSortQuery("issue_date")}
          >
            <span>Issue Date</span>
            {"issue_date" === column && value === "asc" && (
              <ArrowDown size={16} />
            )}
            {"issue_date" === column && value === "desc" && (
              <ArrowUp size={16} />
            )}
          </Button>
        </TableHead>

        <TableHead className="w-[100px]">Actions</TableHead>
      </TableRow>
    </BaseTableHeader>
  );
}
