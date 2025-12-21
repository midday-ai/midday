"use client";

import { cn } from "@midday/ui/cn";
import { TableCell, TableRow } from "@midday/ui/table";
import type { Cell, Row } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import type React from "react";
import type { CSSProperties } from "react";
import { memo } from "react";
import type { TableColumnMeta } from "./types";

interface VirtualRowProps<TData> {
  row: Row<TData>;
  virtualStart: number;
  rowHeight: number;
  onCellClick?: (rowId: string, columnId: string) => void;
  getStickyStyle: (columnId: string) => CSSProperties;
  getStickyClassName: (columnId: string, baseClassName?: string) => string;
  nonClickableColumns?: Set<string>;
}

function VirtualRowInner<TData>({
  row,
  virtualStart,
  rowHeight,
  onCellClick,
  getStickyStyle,
  getStickyClassName,
  nonClickableColumns = new Set(["select", "actions"]),
}: VirtualRowProps<TData>) {
  const cells = row.getVisibleCells();
  const lastCellId = cells[cells.length - 1]?.column.id ?? "";

  return (
    <TableRow
      data-index={row.index}
      className={cn(
        "group cursor-pointer select-text",
        "hover:bg-[#F2F1EF] hover:dark:bg-[#0f0f0f]",
        "flex items-center border-b border-border",
        "absolute top-0 left-0 w-full min-w-full",
      )}
      style={{
        height: rowHeight,
        transform: `translateY(${virtualStart}px)`,
        contain: "layout style paint",
      }}
    >
      {cells.map((cell: Cell<TData, unknown>, cellIndex: number) => {
        const columnId = cell.column.id;
        const meta = cell.column.columnDef.meta as TableColumnMeta | undefined;
        const isSticky = meta?.sticky ?? false;
        const isActions = columnId === "actions";
        const isLastBeforeActions =
          cellIndex === cells.length - 2 && lastCellId === "actions";

        // Build style: dynamic width + sticky positioning
        const cellStyle: CSSProperties = {
          width: cell.column.getSize(),
          ...getStickyStyle(columnId),
          // Apply flex-1 to last non-sticky column before actions
          ...(isLastBeforeActions && !isSticky && { flex: 1 }),
        };

        // Build className from meta with proper sticky handling
        const cellClassName = getStickyClassName(columnId, meta?.className);

        return (
          <TableCell
            key={cell.id}
            className={cn(
              "h-full flex items-center",
              cellClassName,
              isActions && "justify-center",
            )}
            style={cellStyle}
            onClick={() => {
              if (!nonClickableColumns.has(columnId)) {
                onCellClick?.(row.id, columnId);
              }
            }}
          >
            <div className="w-full overflow-hidden truncate">
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          </TableCell>
        );
      })}
    </TableRow>
  );
}

// Custom comparison for memo - only re-render when row data or position changes
function arePropsEqual<TData>(
  prevProps: VirtualRowProps<TData>,
  nextProps: VirtualRowProps<TData>,
): boolean {
  return (
    prevProps.row.id === nextProps.row.id &&
    prevProps.virtualStart === nextProps.virtualStart &&
    prevProps.rowHeight === nextProps.rowHeight &&
    // Check if row selection state changed
    prevProps.row.getIsSelected() === nextProps.row.getIsSelected()
  );
}

// Export memoized component with generics
export const VirtualRow = memo(VirtualRowInner, arePropsEqual) as <TData>(
  props: VirtualRowProps<TData>,
) => React.ReactNode;
