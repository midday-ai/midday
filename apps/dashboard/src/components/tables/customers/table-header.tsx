"use client";

import { useCustomerParams } from "@/hooks/use-customer-params";
import { Button } from "@midday/ui/button";
import {
  TableHeader as BaseTableHeader,
  TableHead,
  TableRow,
} from "@midday/ui/table";
import { ArrowDown, ArrowUp } from "lucide-react";

export function TableHeader() {
  const { setParams, sort } = useCustomerParams({ shallow: false });
  const [column, value] = sort || [];

  const createSortQuery = (name: string) => {
    const [currentColumn, currentValue] = sort || [];

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
        <TableHead>
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
        <TableHead className="hidden md:table-cell">
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
            // onClick={() => createSortQuery("customer")}
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
            // onClick={() => createSortQuery("projects")}
          >
            <span>Projects</span>
            {"projects" === column && value === "asc" && (
              <ArrowDown size={16} />
            )}
            {"projects" === column && value === "desc" && <ArrowUp size={16} />}
          </Button>
        </TableHead>

        <TableHead className="hidden md:table-cell">
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

        <TableHead className="hidden md:table-cell">Actions</TableHead>
      </TableRow>
    </BaseTableHeader>
  );
}
