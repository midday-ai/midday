"use client";

import type { ColumnSizingState, VisibilityState } from "@tanstack/react-table";
import { TableSkeleton } from "@/components/tables/core";
import { columns } from "./columns";

interface LoadingProps {
  isEmpty?: boolean;
  columnVisibility?: VisibilityState;
  columnSizing?: ColumnSizingState;
  columnOrder?: string[];
}

export function Loading({
  isEmpty,
  columnVisibility = {},
  columnSizing = {},
  columnOrder = [],
}: LoadingProps) {
  return (
    <TableSkeleton
      columns={columns}
      columnVisibility={columnVisibility}
      columnSizing={columnSizing}
      columnOrder={columnOrder}
      stickyColumnIds={["select", "date", "description"]}
      actionsColumnId="actions"
      isEmpty={isEmpty}
    />
  );
}
