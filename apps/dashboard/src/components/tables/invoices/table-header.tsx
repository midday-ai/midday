"use client";

import { HorizontalPagination } from "@/components/horizontal-pagination";
import { DraggableHeader } from "@/components/tables/draggable-header";
import { ResizeHandle } from "@/components/tables/resize-handle";
import { useSortParams } from "@/hooks/use-sort-params";
import {
  INVOICES_STICKY_COLUMNS,
  useStickyColumns,
} from "@/hooks/use-sticky-columns";
import {
  SortableContext,
  horizontalListSortingStrategy,
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
  invoiceNumber: "invoice_number",
  status: "status",
  dueDate: "due_date",
  customer: "customer",
  amount: "amount",
  issueDate: "issue_date",
};

// Columns that cannot be reordered (sticky columns)
const NON_REORDERABLE_COLUMNS = new Set(["select", "invoiceNumber", "actions"]);

export function DataTableHeader<TData>({
  table,
  loading,
  tableScroll,
}: Props<TData>) {
  const { params, setParams } = useSortParams();
  const [sortColumn, sortValue] = params.sort || [];

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
    stickyColumns: INVOICES_STICKY_COLUMNS,
  });

  // Get sortable column IDs (excluding sticky columns)
  const sortableColumnIds = useMemo(() => {
    if (!table) return [];
    return table
      .getAllLeafColumns()
      .filter((col) => !NON_REORDERABLE_COLUMNS.has(col.id))
      .map((col) => col.id);
  }, [table]);

  if (!table) return null;

  const headerGroups = table.getHeaderGroups();

  return (
    <TableHeader className="border-0 sticky top-0 z-20 bg-background w-full">
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
              const canReorder = !NON_REORDERABLE_COLUMNS.has(columnId);

              if (!isVisible(columnId)) return null;

              // Check if this is the last column before actions (should flex to fill space)
              const isLastBeforeActions =
                headerIndex === headers.length - 2 &&
                headers[headers.length - 1]?.column.id === "actions";

              const headerStyle = {
                width: header.getSize(),
                minWidth: isSticky
                  ? header.getSize()
                  : header.column.columnDef.minSize,
                maxWidth: isSticky ? header.getSize() : undefined,
                ...getStickyStyle(columnId),
                ...(columnId !== "actions" &&
                  !isLastBeforeActions && {
                    borderRight: "1px solid hsl(var(--border))",
                  }),
                // Only apply flex: 1 to non-sticky columns
                ...(isLastBeforeActions &&
                  !isSticky && {
                    flex: 1,
                  }),
                ...(columnId === "actions" && {
                  borderLeft: "1px solid hsl(var(--border))",
                  borderTop: "1px solid hsl(var(--border))",
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
                  ? "group/header relative h-full px-4 border-t border-border flex items-center justify-center md:sticky md:right-0 bg-background z-10"
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
  sortColumn: string | undefined,
  sortValue: string | undefined,
  createSortQuery: (name: string) => void,
  table: Table<TData>,
  tableScroll?: TableScrollState,
) {
  const sortField = sortFieldMap[columnId];
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

  // Invoice Number column - special case with horizontal pagination
  if (columnId === "invoiceNumber") {
    return (
      <div className="flex items-center justify-between w-full overflow-hidden">
        <div className="min-w-0 overflow-hidden">
          <SortButton
            label="Invoice no."
            sortField="invoice_number"
            currentSortColumn={sortColumn}
            currentSortValue={sortValue}
            onSort={createSortQuery}
          />
        </div>
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

  // Sortable headers
  if (sortField) {
    const headerLabel = meta?.headerLabel || getHeaderLabel(columnId);
    return (
      <div className="w-full overflow-hidden">
        <SortButton
          label={headerLabel}
          sortField={sortField}
          currentSortColumn={sortColumn}
          currentSortValue={sortValue}
          onSort={createSortQuery}
        />
      </div>
    );
  }

  // Non-sortable headers - just render the label
  const headerLabel = meta?.headerLabel || getHeaderLabel(columnId);
  return <span className="truncate">{headerLabel}</span>;
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
      className="p-0 hover:bg-transparent space-x-2 min-w-0 max-w-full"
      variant="ghost"
      onClick={(e) => {
        e.stopPropagation(); // Prevent drag when clicking sort
        onSort(sortField);
      }}
    >
      <span className="truncate">{label}</span>
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
    select: "",
    invoiceNumber: "Invoice no.",
    status: "Status",
    dueDate: "Due date",
    customer: "Customer",
    amount: "Amount",
    vatRate: "VAT Rate",
    vatAmount: "VAT Amount",
    taxRate: "Tax Rate",
    taxAmount: "Tax Amount",
    exclVat: "Excl. VAT",
    exclTax: "Excl. Tax",
    internalNote: "Internal Note",
    issueDate: "Issue date",
    sentAt: "Sent at",
    actions: "Actions",
  };
  return labels[columnId] || columnId;
}

// Legacy export for backwards compatibility with skeleton
export { DataTableHeader as TableHeader };
