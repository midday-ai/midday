"use client";

import { TableSkeleton } from "@/components/tables/core";
import type { ColumnSizingState, VisibilityState } from "@tanstack/react-table";
import { columns } from "./columns";

interface CollectionsSkeletonProps {
  columnVisibility?: VisibilityState;
  columnSizing?: ColumnSizingState;
  columnOrder?: string[];
  isEmpty?: boolean;
}

export function CollectionsSkeleton({
  columnVisibility = {},
  columnSizing = {},
  columnOrder = [],
  isEmpty = false,
}: CollectionsSkeletonProps) {
  return (
    <TableSkeleton
      columns={columns}
      rowCount={25}
      columnVisibility={columnVisibility}
      columnSizing={columnSizing}
      columnOrder={columnOrder}
      stickyColumnIds={["merchant"]}
      actionsColumnId="actions"
      isEmpty={isEmpty}
    />
  );
}
