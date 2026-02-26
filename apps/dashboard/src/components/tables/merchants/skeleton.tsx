"use client";

import { TableSkeleton } from "@/components/tables/core";
import type { ColumnSizingState, VisibilityState } from "@tanstack/react-table";
import { columns } from "./columns";

interface MerchantsSkeletonProps {
  columnVisibility?: VisibilityState;
  columnSizing?: ColumnSizingState;
  columnOrder?: string[];
  isEmpty?: boolean;
}

export function MerchantsSkeleton({
  columnVisibility = {},
  columnSizing = {},
  columnOrder = [],
  isEmpty = false,
}: MerchantsSkeletonProps) {
  return (
    <TableSkeleton
      columns={columns}
      rowCount={25}
      columnVisibility={columnVisibility}
      columnSizing={columnSizing}
      columnOrder={columnOrder}
      stickyColumnIds={["name"]}
      actionsColumnId="actions"
      isEmpty={isEmpty}
    />
  );
}
