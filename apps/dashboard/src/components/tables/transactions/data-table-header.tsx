"use client";

import { useSortParams } from "@/hooks/use-sort-params";
import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
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

interface Props {
  table?: TableInterface;
  loading?: boolean;
}

export function DataTableHeader({ table, loading }: Props) {
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

  const isVisible = (id: string) =>
    loading ||
    table
      ?.getAllLeafColumns()
      .find((col) => col.id === id)
      ?.getIsVisible();

  return (
    <TableHeader>
      <TableRow className="h-[45px] hover:bg-transparent">
        <TableHead className="min-w-[50px] hidden md:table-cell px-3 md:px-4 py-2">
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
          <TableHead className="min-w-[120px] px-3 md:px-4 py-2">
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
          <TableHead className="w-[100px] md:w-[320px] px-3 md:px-4 py-2">
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("name")}
            >
              <span>Description</span>
              {"name" === column && value === "asc" && <ArrowDown size={16} />}
              {"name" === column && value === "desc" && <ArrowUp size={16} />}
            </Button>
          </TableHead>
        )}

        {isVisible("amount") && (
          <TableHead className="md:min-w-[200px] px-3 md:px-4 py-2">
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

        {isVisible("category") && (
          <TableHead className="md:min-w-[200px] hidden md:table-cell px-3 md:px-4 py-2">
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

        {isVisible("tags") && (
          <TableHead className="md:min-w-[170px] hidden md:table-cell px-3 md:px-4 py-2">
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("tags")}
            >
              <span>Tags</span>
            </Button>
          </TableHead>
        )}

        {isVisible("bank_account") && (
          <TableHead className="md:w-[250px] hidden md:table-cell px-3 md:px-4 py-2">
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
          <TableHead className="md:min-w-[140px] hidden md:table-cell px-3 md:px-4 py-2">
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
          <TableHead className="md:w-[220px] hidden md:table-cell px-3 md:px-4 py-2">
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
          <TableHead className="hidden md:table-cell px-3 md:px-4 py-2">
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
      </TableRow>
    </TableHeader>
  );
}
