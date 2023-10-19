"use client";
import { Button } from "@midday/ui/button";
import { TableHead, TableHeader, TableRow } from "@midday/ui/table";
import { ArrowDown, ArrowUp } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const headers = [
  { id: "name", label: "To/From" },
  { id: "date", label: "Date" },
  { id: "amount", label: "Amount" },
  { id: "method", label: "Method" },
  { id: "assigned", label: "Assigned" },
  { id: "attachment", label: "Status" },
];

export function DataTableHeader() {
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
    [searchParams],
  );

  return (
    <TableHeader className="sticky -top-[1px] z-10 ">
      <TableRow>
        {headers.map((header) => (
          <TableHead
            key={header.id}
            className="backdrop-filter backdrop-blur-lg bg-background/80"
          >
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery(header.id)}
            >
              <span>{header.label}</span>
              {header.id === column && value === "asc" && (
                <ArrowDown size={16} />
              )}

              {header.id === column && value === "desc" && (
                <ArrowUp size={16} />
              )}
            </Button>
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}
