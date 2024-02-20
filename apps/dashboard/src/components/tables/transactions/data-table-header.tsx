"use client";

import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import { TableHead, TableHeader, TableRow } from "@midday/ui/table";
import { ArrowDown, ArrowUp } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function DataTableHeader({ table }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [column, value] = searchParams.get("sort")
    ? searchParams.get("sort")?.split(":")
    : [];

  const createSortQuery = useCallback(
    (name: string) => {
      const params = new URLSearchParams(searchParams);
      const prevSort = params.get("sort");

      if (`${name}:asc` === prevSort) {
        params.set("sort", `${name}:desc`);
      } else if (`${name}:desc` === prevSort) {
        params.delete("sort");
      } else {
        params.set("sort", `${name}:asc`);
      }

      router.replace(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  const isVisible = (id) =>
    table
      ?.getAllLeafColumns()
      .find((col) => col.id === id)
      .getIsVisible();

  return (
    <TableHeader>
      <TableRow className="h-[45px]">
        <TableHead className="w-[50px]">
          <Checkbox
            checked={
              table?.getIsAllPageRowsSelected() ||
              (table?.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
          />
        </TableHead>

        {isVisible("date") && (
          <TableHead className="w-[120px]">
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
          <TableHead className="w-[320px]">
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

        {isVisible("category") && (
          <TableHead className="w-[200px]">
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

        {isVisible("bank_account") && (
          <TableHead className="w-[250px]">
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("bank_account")}
            >
              <span>Bank Account</span>
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
          <TableHead className="w-[200px]">
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
          <TableHead className="w-[220px]">
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

        {isVisible("amount") && (
          <TableHead>
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
