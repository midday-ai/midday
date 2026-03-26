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
    <div style={{ marginBottom: 24, overflowX: "auto" }}>
      <table
        style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
            {columns.map((col) => (
              <th
                key={col.accessorKey}
                style={{
                  padding: "8px 12px",
                  fontWeight: 400,
                  color: "var(--text-muted)",
                  textAlign: col.align || "left",
                }}
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
              style={{ borderBottom: "1px solid var(--border-color)" }}
            >
              {columns.map((col) => (
                <td
                  key={col.accessorKey}
                  style={{
                    padding: "8px 12px",
                    color: "var(--text-primary)",
                    textAlign: col.align || "left",
                  }}
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
