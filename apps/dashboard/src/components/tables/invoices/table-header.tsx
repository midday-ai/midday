"use client";

import { HorizontalPagination } from "@/components/horizontal-pagination";
import { useSortParams } from "@/hooks/use-sort-params";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import {
  TableHeader as BaseTableHeader,
  TableHead,
  TableRow,
} from "@midday/ui/table";
import { ArrowDown, ArrowUp } from "lucide-react";

interface TableColumn {
  id: string;
  getIsVisible: () => boolean;
}

interface TableInterface {
  getAllLeafColumns: () => TableColumn[];
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

export function TableHeader({ table, tableScroll }: Props) {
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

  const isVisible = (id: string) =>
    table
      ?.getAllLeafColumns()
      .find((col) => col.id === id)
      ?.getIsVisible();

  return (
    <BaseTableHeader className="border-l-0 border-r-0">
      <TableRow>
        {isVisible("invoiceNumber") && (
          <TableHead className="w-[220px] min-w-[220px] sticky left-0 bg-background z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background after:z-[-1]">
            <div className="flex items-center justify-between">
              <Button
                className="p-0 hover:bg-transparent space-x-2"
                variant="ghost"
                onClick={() => createSortQuery("invoice_number")}
              >
                <span>Invoice no.</span>
                {"invoiceNumber" === column && value === "asc" && (
                  <ArrowDown size={16} />
                )}
                {"invoiceNumber" === column && value === "desc" && (
                  <ArrowUp size={16} />
                )}
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
        )}
        {isVisible("status") && (
          <TableHead className="w-[150px]">
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("status")}
            >
              <span>Status</span>
              {"status" === column && value === "asc" && (
                <ArrowDown size={16} />
              )}
              {"status" === column && value === "desc" && <ArrowUp size={16} />}
            </Button>
          </TableHead>
        )}

        {isVisible("dueDate") && (
          <TableHead className="w-[180px]">
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("due_date")}
            >
              <span>Due Date</span>
              {"dueDate" === column && value === "asc" && (
                <ArrowDown size={16} />
              )}
              {"dueDate" === column && value === "desc" && (
                <ArrowUp size={16} />
              )}
            </Button>
          </TableHead>
        )}

        {isVisible("customer") && (
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
              {"customer" === column && value === "desc" && (
                <ArrowUp size={16} />
              )}
            </Button>
          </TableHead>
        )}
        {isVisible("amount") && (
          <TableHead className="w-[200px]">
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("amount")}
            >
              <span>Amount</span>
              {"amount" === column && value === "asc" && (
                <ArrowDown size={16} />
              )}
              {"amount" === column && value === "desc" && <ArrowUp size={16} />}
            </Button>
          </TableHead>
        )}

        {isVisible("vatRate") && (
          <TableHead className="w-[100px] min-w-[100px]">
            <span>VAT Rate</span>
          </TableHead>
        )}

        {isVisible("vatAmount") && (
          <TableHead className="w-[150px] min-w-[150px]">
            <span>VAT Amount</span>
          </TableHead>
        )}

        {isVisible("taxRate") && (
          <TableHead className="w-[100px] min-w-[100px]">
            <span>Tax Rate</span>
          </TableHead>
        )}

        {isVisible("taxAmount") && (
          <TableHead className="w-[150px] min-w-[150px]">
            <span>Tax Amount</span>
          </TableHead>
        )}

        {isVisible("exclVat") && (
          <TableHead className="w-[150px] min-w-[150px]">
            <span>Excl. VAT</span>
          </TableHead>
        )}

        {isVisible("exclTax") && (
          <TableHead className="w-[150px] min-w-[150px]">
            <span>Excl. Tax</span>
          </TableHead>
        )}

        {isVisible("internalNote") && (
          <TableHead className="w-[150px] min-w-[150px]">
            <span>Internal Note</span>
          </TableHead>
        )}

        {isVisible("issueDate") && (
          <TableHead className="w-[120px] min-w-[120px]">
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("issue_date")}
            >
              <span>Issue Date</span>
              {"issueDate" === column && value === "asc" && (
                <ArrowDown size={16} />
              )}
              {"issueDate" === column && value === "desc" && (
                <ArrowUp size={16} />
              )}
            </Button>
          </TableHead>
        )}

        {isVisible("sentAt") && (
          <TableHead className="w-[150px] min-w-[150px]">
            <span>Sent at</span>
          </TableHead>
        )}

        {isVisible("actions") && (
          <TableHead
            className={cn(
              "w-[100px] sticky right-0 bg-background z-30",
              "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-border",
              "after:absolute after:left-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-r after:from-transparent after:to-background after:z-[-1]",
            )}
          >
            Actions
          </TableHead>
        )}
      </TableRow>
    </BaseTableHeader>
  );
}
