"use client";

import { TableSkeleton } from "@/components/tables/core";
import { columns } from "./columns";

export function DealSkeleton() {
  return (
    <TableSkeleton
      columns={columns}
      rowCount={25}
      stickyColumnIds={["select", "dealNumber"]}
      actionsColumnId="actions"
    />
  );
}
