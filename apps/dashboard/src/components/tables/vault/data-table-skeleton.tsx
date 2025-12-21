"use client";

import { TableSkeleton } from "@/components/tables/core";
import { columns } from "./columns";

export function DataTableSkeleton() {
  return (
    <TableSkeleton
      columns={columns}
      rowCount={15}
      stickyColumnIds={["select", "title"]}
      actionsColumnId="actions"
    />
  );
}
