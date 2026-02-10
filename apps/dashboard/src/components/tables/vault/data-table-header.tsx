"use client";

import {
  horizontalListSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import { Checkbox } from "@midday/ui/checkbox";
import { TableHead, TableHeader, TableRow } from "@midday/ui/table";
import type { Header, Table } from "@tanstack/react-table";
import { useMemo } from "react";
import { HorizontalPagination } from "@/components/horizontal-pagination";
import {
  ACTIONS_FULL_WIDTH_HEADER_CLASS,
  ACTIONS_STICKY_HEADER_CLASS,
  type TableScrollState,
} from "@/components/tables/core";
import { DraggableHeader } from "@/components/tables/draggable-header";
import { ResizeHandle } from "@/components/tables/resize-handle";
import { useStickyColumns } from "@/hooks/use-sticky-columns";
import { NON_REORDERABLE_COLUMNS, STICKY_COLUMNS } from "@/utils/table-configs";

interface Props<TData> {
  table?: Table<TData>;
  loading?: boolean;
  tableScroll?: TableScrollState;
}

export function DataTableHeader<TData>({
  table,
  loading,
  tableScroll,
}: Props<TData>) {
  // Use the reusable sticky columns hook
  const { getStickyStyle, getStickyClassName, isVisible } = useStickyColumns({
    table,
    loading,
    stickyColumns: STICKY_COLUMNS.vault,
  });

  // Get sortable column IDs (excluding sticky columns)
  const sortableColumnIds = useMemo(() => {
    if (!table) return [];
    return table
      .getAllLeafColumns()
      .filter((col) => !NON_REORDERABLE_COLUMNS.vault.has(col.id))
      .map((col) => col.id);
  }, [table]);

  if (!table) return null;

  const headerGroups = table.getHeaderGroups();

  return (
    <TableHeader className="border-0 block sticky top-0 z-20 bg-background w-full">
      {headerGroups.map((headerGroup) => (
        <TableRow
          key={headerGroup.id}
          className="h-[45px] hover:bg-transparent flex items-center !border-b-0 min-w-full"
        >
          <SortableContext
            items={sortableColumnIds}
            strategy={horizontalListSortingStrategy}
          >
            {headerGroup.headers.map((header, headerIndex, headers) => {
              const columnId = header.column.id;
              const meta = header.column.columnDef.meta as
                | { sticky?: boolean; className?: string }
                | undefined;
              const isSticky = meta?.sticky;
              const canReorder = !NON_REORDERABLE_COLUMNS.vault.has(columnId);
              const isActions = columnId === "actions";

              if (!isVisible(columnId)) return null;

              // Check if actions should be full width (no non-sticky visible columns)
              const hasNonStickyVisible = headers.some((h) => {
                if (h.column.id === "actions") return false;
                if (!isVisible(h.column.id)) return false;
                const hMeta = h.column.columnDef.meta as
                  | { sticky?: boolean }
                  | undefined;
                return !hMeta?.sticky;
              });
              const actionsFullWidth = isActions && !hasNonStickyVisible;

              // Check if this column should flex
              const isLastBeforeActions =
                headerIndex === headers.length - 2 &&
                headers[headers.length - 1]?.column.id === "actions";
              const shouldFlex =
                (isLastBeforeActions && !isSticky) || actionsFullWidth;

              const headerStyle = {
                width: actionsFullWidth ? undefined : header.getSize(),
                minWidth: actionsFullWidth
                  ? undefined
                  : isSticky
                    ? header.getSize()
                    : header.column.columnDef.minSize,
                maxWidth: actionsFullWidth
                  ? undefined
                  : isSticky
                    ? header.getSize()
                    : undefined,
                ...(!actionsFullWidth && getStickyStyle(columnId)),
                ...(shouldFlex && { flex: 1 }),
              };

              // Non-reorderable columns (sticky + actions)
              if (!canReorder) {
                const stickyClass = getStickyClassName(
                  columnId,
                  "group/header relative h-full px-4 border-t border-border flex items-center",
                );
                const finalClassName = isActions
                  ? actionsFullWidth
                    ? ACTIONS_FULL_WIDTH_HEADER_CLASS
                    : ACTIONS_STICKY_HEADER_CLASS
                  : `${stickyClass} bg-background z-10`;

                return (
                  <TableHead
                    key={header.id}
                    className={finalClassName}
                    style={headerStyle}
                  >
                    {renderHeaderContent(header, columnId, table, tableScroll)}
                    {header.column.getCanResize() && (
                      <ResizeHandle header={header} />
                    )}
                  </TableHead>
                );
              }

              // Draggable columns
              return (
                <DraggableHeader
                  key={header.id}
                  id={columnId}
                  style={headerStyle}
                >
                  <div className="flex items-center flex-1 min-w-0 overflow-hidden">
                    {renderHeaderContent(header, columnId, table, tableScroll)}
                  </div>
                  {header.column.getCanResize() && (
                    <ResizeHandle header={header} />
                  )}
                </DraggableHeader>
              );
            })}
          </SortableContext>
        </TableRow>
      ))}
    </TableHeader>
  );
}

function renderHeaderContent<TData>(
  header: Header<TData, unknown>,
  columnId: string,
  table: Table<TData>,
  tableScroll?: TableScrollState,
) {
  const meta = header.column.columnDef.meta as
    | { headerLabel?: string }
    | undefined;

  // Select column - select all checkbox
  if (columnId === "select") {
    return (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    );
  }

  // Actions column - static text
  if (columnId === "actions") {
    return (
      <span className="text-muted-foreground w-full text-center">Actions</span>
    );
  }

  // Title column - special case with horizontal pagination
  if (columnId === "title") {
    return (
      <div className="flex items-center justify-between w-full overflow-hidden">
        <span className="truncate">Name</span>
        {tableScroll?.isScrollable && (
          <HorizontalPagination
            canScrollLeft={tableScroll.canScrollLeft}
            canScrollRight={tableScroll.canScrollRight}
            onScrollLeft={tableScroll.scrollLeft}
            onScrollRight={tableScroll.scrollRight}
            className="hidden md:flex flex-shrink-0"
          />
        )}
      </div>
    );
  }

  // Non-sortable headers - just render the label
  const headerLabel = meta?.headerLabel || getHeaderLabel(columnId);
  return <span className="truncate">{headerLabel}</span>;
}

function getHeaderLabel(columnId: string): string {
  const labels: Record<string, string> = {
    select: "",
    title: "Name",
    tags: "Tags",
    size: "Size",
    actions: "Actions",
  };
  return labels[columnId] || columnId;
}
