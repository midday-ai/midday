import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc";

export interface SortState {
  field: string;
  direction: SortDirection;
}

/**
 * Hook for managing sort state
 * Returns current sort state, handler for SortableHeader, and the sort string for URL/API
 */
export function useSort(
  sortString: string | undefined,
  onSortChange: (sort: string | undefined) => void,
) {
  const currentSort = React.useMemo(() => parseSort(sortString), [sortString]);

  const handleSort = React.useCallback(
    (field: string | undefined, direction: SortDirection | undefined) => {
      if (field && direction) {
        onSortChange(`${field}:${direction}`);
      } else {
        onSortChange(undefined);
      }
    },
    [onSortChange],
  );

  return { currentSort, handleSort, sortString };
}

interface SortableHeaderProps {
  field: string;
  label: string;
  currentSort?: SortState;
  onSort: (
    field: string | undefined,
    direction: SortDirection | undefined,
  ) => void;
  className?: string;
}

/**
 * Sortable table header component
 * Displays sort direction indicator and toggles direction on click
 * Cycle: unsorted -> desc -> asc -> unsorted
 */
export function SortableHeader({
  field,
  label,
  currentSort,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = currentSort?.field === field;
  const direction = isActive ? currentSort.direction : undefined;

  const handleClick = () => {
    if (!isActive) {
      // First click: sort descending (newest/highest first)
      onSort(field, "desc");
    } else if (direction === "desc") {
      // Second click: sort ascending
      onSort(field, "asc");
    } else {
      // Third click: clear sort (reset to default)
      onSort(undefined, undefined);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex items-center gap-1 text-left font-medium transition-colors hover:text-foreground",
        isActive ? "text-foreground" : "text-muted-foreground",
        className,
      )}
    >
      {label}
      <span className="inline-flex h-4 w-4 items-center justify-center">
        {isActive ? (
          direction === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-50" />
        )}
      </span>
    </button>
  );
}

/**
 * Helper to parse sort string into SortState
 */
export function parseSort(sort?: string): SortState | undefined {
  if (!sort) return undefined;
  const [field, dir] = sort.split(":");
  if (!field) return undefined;
  return { field, direction: dir === "asc" ? "asc" : "desc" };
}

/**
 * Helper to create sort string from field and direction
 */
export function createSort(field: string, direction: SortDirection): string {
  return `${field}:${direction}`;
}
