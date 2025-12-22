"use client";

import { TableSkeleton } from "@/components/tables/core";
import { columns } from "./columns";

export function InvoiceSkeleton() {
  return (
    <TableSkeleton
      columns={columns}
      rowCount={25}
      stickyColumnIds={["select", "invoiceNumber"]}
      actionsColumnId="actions"
    />
  );
}
