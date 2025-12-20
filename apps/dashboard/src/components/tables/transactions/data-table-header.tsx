"use client";

import { HorizontalPagination } from "@/components/horizontal-pagination";
import { DraggableHeader } from "@/components/tables/draggable-header";
import { ResizeHandle } from "@/components/tables/resize-handle";
import { useSortParams } from "@/hooks/use-sort-params";
import { useStickyColumns } from "@/hooks/use-sticky-columns";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import { TableHead, TableHeader, TableRow } from "@midday/ui/table";
import type { Header, Table } from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useCallback, useMemo } from "react";

interface TableScrollState {
  containerRef: React.RefObject<HTMLDivElement | null>;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  isScrollable: boolean;
  scrollLeft: () => void;
  scrollRight: () => void;
}

interface Props<TData> {
  table?: Table<TData>;
  loading?: boolean;
  tableScroll?: TableScrollState;
}

// Map column IDs to their sortable field names
const sortFieldMap: Record<string, string> = {
  date: "date",
  description: "name",
  amount: "amount",
  category: "category",
  counterparty: "counterparty",
  tags: "tags",
  bank_account: "bank_account",
  method: "method",
  assigned: "assigned",
  status: "attachment",
};

// Columns that cannot be reordered (sticky columns)
const NON_REORDERABLE_COLUMNS = new Set([
  "select",
  "date",
  "description",
  "actions",
]);

export function DataTableHeader<TData>({
  table,
  loading,
  tableScroll,
}: Props<TData>) {
  const { params, setParams } = useSortParams();
  const [sortColumn, sortValue] = params.sort || [];

  // Configure sensors for drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const createSortQuery = useCallback(
    (name: string) => {
      if (sortValue === "asc") {
        setParams({ sort: [name, "desc"] });
      } else if (sortValue === "desc") {
        setParams({ sort: null });
      } else {
        setParams({ sort: [name, "asc"] });
      }
    },
    [sortValue, setParams],
  );

  // Use the reusable sticky columns hook
  const { getStickyStyle, getStickyClassName, isVisible } = useStickyColumns({
    table,
    loading,
  });

  // Get sortable column IDs (excluding sticky columns)
  const sortableColumnIds = useMemo(() => {
    if (!table) return [];
    return table
      .getAllLeafColumns()
      .filter((col) => !NON_REORDERABLE_COLUMNS.has(col.id))
      .map((col) => col.id);
  }, [table]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || !table || active.id === over.id) return;

      const currentOrder = table.getAllLeafColumns().map((col) => col.id);
      const oldIndex = currentOrder.indexOf(active.id as string);
      const newIndex = currentOrder.indexOf(over.id as string);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(currentOrder, oldIndex, newIndex);
        table.setColumnOrder(newOrder);
      }
    },
    [table],
  );

  if (!table) return null;

  const headerGroups = table.getHeaderGroups();

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <TableHeader className="border-0 sticky top-0 z-20 bg-background">
        {headerGroups.map((headerGroup) => (
          <TableRow
            key={headerGroup.id}
            className="h-[45px] hover:bg-transparent flex items-center !border-b-0"
          >
            <SortableContext
              items={sortableColumnIds}
              strategy={horizontalListSortingStrategy}
            >
              {headerGroup.headers.map((header) => {
                const columnId = header.column.id;
                const meta = header.column.columnDef.meta as
                  | { sticky?: boolean; className?: string }
                  | undefined;
                const isSticky = meta?.sticky;
                const canReorder = !NON_REORDERABLE_COLUMNS.has(columnId);

                if (!isVisible(columnId)) return null;

                const headerStyle = {
                  width: header.getSize(),
                  minWidth: isSticky
                    ? header.getSize()
                    : header.column.columnDef.minSize,
                  maxWidth: isSticky
                    ? header.getSize()
                    : header.column.columnDef.maxSize,
                  ...getStickyStyle(columnId),
                  ...(columnId !== "actions" &&
                    columnId !== "status" && {
                      borderRight: "1px solid hsl(var(--border))",
                    }),
                  ...(columnId === "actions" && {
                    borderLeft: "1px solid hsl(var(--border))",
                  }),
                };

                // Sticky columns use regular TableHead (not draggable)
                if (!canReorder) {
                  const stickyClass = getStickyClassName(
                    columnId,
                    "group/header relative h-full px-4 border-t border-border flex items-center",
                  );
                  const isActionsColumn = columnId === "actions";
                  const finalClassName = isActionsColumn
                    ? "group/header relative h-full px-4 border-t border-border flex items-center md:sticky md:right-0 bg-background z-10"
                    : `${stickyClass} bg-background z-10`;

                  return (
                    <TableHead
                      key={header.id}
                      className={finalClassName}
                      style={headerStyle}
                    >
                      {renderHeaderContent(
                        header,
                        columnId,
                        sortColumn,
                        sortValue,
                        createSortQuery,
                        table,
                        tableScroll,
                      )}
                      <ResizeHandle header={header} />
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
                    <div className="flex items-center flex-1 min-w-0">
                      {renderHeaderContent(
                        header,
                        columnId,
                        sortColumn,
                        sortValue,
                        createSortQuery,
                        table,
                        tableScroll,
                      )}
                    </div>
                    <ResizeHandle header={header} />
                  </DraggableHeader>
                );
              })}
            </SortableContext>
          </TableRow>
        ))}
      </TableHeader>
    </DndContext>
  );
}

function renderHeaderContent<TData>(
  header: Header<TData, unknown>,
  columnId: string,
  sortColumn: string | undefined,
  sortValue: string | undefined,
  createSortQuery: (name: string) => void,
  table: Table<TData>,
  tableScroll?: TableScrollState,
) {
  const sortField = sortFieldMap[columnId];

  // Select column - checkbox
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

  // Tax Amount - not sortable
  if (columnId === "taxAmount") {
    return <span>Tax Amount</span>;
  }

  // Description column - special case with horizontal pagination
  if (columnId === "description") {
    return (
      <div className="flex items-center justify-between w-full">
        <SortButton
          label="Description"
          sortField="name"
          currentSortColumn={sortColumn}
          currentSortValue={sortValue}
          onSort={createSortQuery}
        />
        {tableScroll?.isScrollable && (
          <HorizontalPagination
            canScrollLeft={tableScroll.canScrollLeft}
            canScrollRight={tableScroll.canScrollRight}
            onScrollLeft={tableScroll.scrollLeft}
            onScrollRight={tableScroll.scrollRight}
            className="hidden md:flex"
          />
        )}
      </div>
    );
  }

  // Default sortable header
  if (sortField) {
    const headerLabel = getHeaderLabel(columnId);
    return (
      <SortButton
        label={headerLabel}
        sortField={sortField}
        currentSortColumn={sortColumn}
        currentSortValue={sortValue}
        onSort={createSortQuery}
      />
    );
  }

  // Fallback - just render the header text
  return <span>{header.column.columnDef.header as string}</span>;
}

function SortButton({
  label,
  sortField,
  currentSortColumn,
  currentSortValue,
  onSort,
}: {
  label: string;
  sortField: string;
  currentSortColumn?: string;
  currentSortValue?: string;
  onSort: (field: string) => void;
}) {
  return (
    <Button
      className="p-0 hover:bg-transparent space-x-2"
      variant="ghost"
      onClick={(e) => {
        e.stopPropagation(); // Prevent drag when clicking sort
        onSort(sortField);
      }}
    >
      <span>{label}</span>
      {sortField === currentSortColumn && currentSortValue === "asc" && (
        <ArrowDown size={16} />
      )}
      {sortField === currentSortColumn && currentSortValue === "desc" && (
        <ArrowUp size={16} />
      )}
    </Button>
  );
}

function getHeaderLabel(columnId: string): string {
  const labels: Record<string, string> = {
    date: "Date",
    description: "Description",
    amount: "Amount",
    taxAmount: "Tax Amount",
    category: "Category",
    counterparty: "From / To",
    tags: "Tags",
    bank_account: "Account",
    method: "Method",
    assigned: "Assigned",
    status: "Status",
    actions: "Actions",
  };
  return labels[columnId] || columnId;
}
