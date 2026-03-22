"use client";

import { cn } from "@midday/ui/cn";

interface Column {
  header: string;
  accessorKey: string;
  align?: "left" | "right" | "center";
}

interface DataTableProps {
  columns: Column[];
  rows: Record<string, unknown>[];
}

export function DataTable({ columns, rows }: DataTableProps) {
  return (
    <div className="mb-6 overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-[#e6e6e6] dark:border-[#1d1d1d]">
            {columns.map((col) => (
              <th
                key={col.accessorKey}
                className={cn(
                  "py-2 px-3 font-normal text-[#707070] dark:text-[#666666]",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center",
                  !col.align && "text-left",
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className="border-b border-[#e6e6e6] dark:border-[#1d1d1d]"
            >
              {columns.map((col) => (
                <td
                  key={col.accessorKey}
                  className={cn(
                    "py-2 px-3 text-black dark:text-white",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                  )}
                >
                  {String(row[col.accessorKey] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
