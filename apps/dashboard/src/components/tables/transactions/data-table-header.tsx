"use client";

import { HorizontalPagination } from "@/components/horizontal-pagination";
import { useSortParams } from "@/hooks/use-sort-params";
import { useStickyColumns } from "@/hooks/use-sticky-columns";
import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import { cn } from "@midday/ui/cn";
import { TableHead, TableHeader, TableRow } from "@midday/ui/table";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useCallback } from "react";

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

interface TableScrollState {
  containerRef: React.RefObject<HTMLDivElement | null>;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  isScrollable: boolean;
  scrollLeft: () => void;
  scrollRight: () => void;
}

interface Props {
  table?: TableInterface;
  loading?: boolean;
  tableScroll?: TableScrollState;
}

export function DataTableHeader({ table, loading, tableScroll }: Props) {
  const { params, setParams } = useSortParams();
  const [column, value] = params.sort || [];

  const createSortQuery = useCallback(
    (name: string) => {
      if (value === "asc") {
        // If currently ascending, switch to descending
        setParams({ sort: [name, "desc"] });
      } else if (value === "desc") {
        // If currently descending, clear sort
        setParams({ sort: null });
      } else {
        // If not sorted on this column, set to ascending
        setParams({ sort: [name, "asc"] });
      }
    },
    [value, setParams],
  );

  // Use the reusable sticky columns hook
  const { getStickyStyle, isVisible } = useStickyColumns({
    table,
    loading,
  });

  return (
    <TableHeader className="border-l-0 border-r-0">
      <TableRow className="h-[45px] hover:bg-transparent">
        <TableHead
          className={cn(
            "min-w-[50px] w-[50px] px-3 md:px-4 py-2 md:sticky md:left-[var(--stick-left)] bg-background z-10 border-r border-border",
            "before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border",
            "after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background after:z-[-1]",
          )}
          style={getStickyStyle("select")}
        >
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

        {isVisible("date") && (
          <TableHead
            className={cn(
              "w-[110px] min-w-[110px] px-3 md:px-4 py-2 md:sticky md:left-[var(--stick-left)] bg-background z-10 border-r border-border",
              "before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border",
              "after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background after:z-[-1]",
            )}
            style={getStickyStyle("date")}
          >
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("date")}
            >
              <span>Date</span>
              {"date" === column && value === "asc" && <ArrowDown size={16} />}
              {"date" === column && value === "desc" && <ArrowUp size={16} />}
            </Button>
          </TableHead>
        )}

        {isVisible("description") && (
          <TableHead
            className={cn(
              "w-[320px] min-w-[320px] px-3 md:px-4 py-2 md:sticky md:left-[var(--stick-left)] bg-background z-10 border-r border-border",
              "before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border",
              "after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background after:z-[-1]",
            )}
            style={getStickyStyle("description")}
          >
            <div className="flex items-center justify-between">
              <Button
                className="p-0 hover:bg-transparent space-x-2"
                variant="ghost"
                onClick={() => createSortQuery("name")}
              >
                <span>Description</span>
                {"name" === column && value === "asc" && (
                  <ArrowDown size={16} />
                )}
                {"name" === column && value === "desc" && <ArrowUp size={16} />}
              </Button>
              {tableScroll?.isScrollable && (
                <HorizontalPagination
                  canScrollLeft={tableScroll.canScrollLeft}
                  canScrollRight={tableScroll.canScrollRight}
                  onScrollLeft={tableScroll.scrollLeft}
                  onScrollRight={tableScroll.scrollRight}
                  className="hidden md:flex"
                />
              )}
            </div>
          </TableHead>
        )}

        {isVisible("amount") && (
          <TableHead className="w-[170px] min-w-[170px] px-3 md:px-4 py-2 border-l border-border">
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

        {isVisible("taxAmount") && (
          <TableHead className="w-[170px] px-3 md:px-4 py-2">
            <span>Tax Amount</span>
          </TableHead>
        )}

        {isVisible("category") && (
          <TableHead className="w-[250px] min-w-[250px] px-3 md:px-4 py-2">
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("category")}
            >
              <span>Category</span>
              {"category" === column && value === "asc" && (
                <ArrowDown size={16} />
              )}
              {"category" === column && value === "desc" && (
                <ArrowUp size={16} />
              )}
            </Button>
          </TableHead>
        )}

        {isVisible("counterparty") && (
          <TableHead className="w-[200px] min-w-[200px] px-3 md:px-4 py-2">
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("counterparty")}
            >
              <span>From / To</span>
              {"counterparty" === column && value === "asc" && (
                <ArrowDown size={16} />
              )}
              {"counterparty" === column && value === "desc" && (
                <ArrowUp size={16} />
              )}
            </Button>
          </TableHead>
        )}

        {isVisible("tags") && (
          <TableHead className="w-[280px] max-w-[280px] px-3 md:px-4 py-2">
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
        )}

        {isVisible("bank_account") && (
          <TableHead className="w-[250px] px-3 md:px-4 py-2">
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("bank_account")}
            >
              <span>Account</span>
              {"bank_account" === column && value === "asc" && (
                <ArrowDown size={16} />
              )}
              {"bank_account" === column && value === "desc" && (
                <ArrowUp size={16} />
              )}
            </Button>
          </TableHead>
        )}

        {isVisible("method") && (
          <TableHead className="w-[140px] min-w-[140px] px-3 md:px-4 py-2">
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("method")}
            >
              <span>Method</span>
              {"method" === column && value === "asc" && (
                <ArrowDown size={16} />
              )}
              {"method" === column && value === "desc" && <ArrowUp size={16} />}
            </Button>
          </TableHead>
        )}

        {isVisible("assigned") && (
          <TableHead className="w-[220px] min-w-[220px] px-3 md:px-4 py-2">
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("assigned")}
            >
              <span>Assigned</span>
              {"assigned" === column && value === "asc" && (
                <ArrowDown size={16} />
              )}
              {"assigned" === column && value === "desc" && (
                <ArrowUp size={16} />
              )}
            </Button>
          </TableHead>
        )}

        {isVisible("status") && (
          <TableHead className="w-[100px] px-3 md:px-4 py-2">
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("attachment")}
            >
              <span>Status</span>
              {"attachment" === column && value === "asc" && (
                <ArrowDown size={16} />
              )}
              {"attachment" === column && value === "desc" && (
                <ArrowUp size={16} />
              )}
            </Button>
          </TableHead>
        )}

        {isVisible("actions") && (
          <TableHead
            className={cn(
              "w-[100px] md:sticky md:right-0 bg-background z-10",
              "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-border",
              "after:absolute after:left-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-r after:from-transparent after:to-background after:z-[-1]",
            )}
          >
            Actions
          </TableHead>
        )}
      </TableRow>
    </TableHeader>
  );
}
