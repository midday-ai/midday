import { cn } from "../utils/cn";

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
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.accessorKey}
                className={cn(
                  "px-3 py-2 font-normal text-muted-foreground",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center",
                  (!col.align || col.align === "left") && "text-left",
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={columns.map((c) => row[c.accessorKey]).join("-")}
              className="border-b border-border"
            >
              {columns.map((col) => (
                <td
                  key={col.accessorKey}
                  className={cn(
                    "px-3 py-2 text-foreground",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    (!col.align || col.align === "left") && "text-left",
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
