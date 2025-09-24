"use client";

import { EditCategoryModal } from "@/components/modals/edit-category-modal";
import { useI18n } from "@/locales/client";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { getTaxTypeLabel } from "@midday/utils/tax";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";
import * as React from "react";

export type Category = RouterOutputs["transactionCategories"]["get"][number];

// Component to display category description from localization
function CategoryTooltip({ category }: { category: any }) {
  const t = useI18n();

  // Priority 1: User-defined description
  if (category.description) {
    return <span>{category.description}</span>;
  }

  // Priority 2: System description from localization
  try {
    return (
      // @ts-expect-error - slug is not nullable
      <span>{t(`transaction_categories.${category.slug}`)}</span>
    );
  } catch {
    // Fallback if translation not found
    return <span>Category description not available</span>;
  }
}

// Flatten categories to include both parents and children with hierarchy info
export function flattenCategories(categories: any[]): any[] {
  const flattened: any[] = [];

  for (const category of categories) {
    // Add parent category
    flattened.push({
      ...category,
      isChild: false,
      hasChildren: category.children && category.children.length > 0,
    });

    // Add children if they exist
    if (category.children && category.children.length > 0) {
      for (const child of category.children) {
        flattened.push({
          ...child,
          isChild: true,
          parentId: category.id,
          hasChildren: false,
        });
      }
    }
  }

  return flattened;
}

export const columns: ColumnDef<any>[] = [
  {
    header: "Name",
    accessorKey: "name",
    cell: ({ row, table }) => {
      const [expandedCategories, setExpandedCategories] = React.useState<
        Set<string>
      >(new Set());

      // Get expanded state from table meta or use local state as fallback
      const tableExpandedCategories =
        (table.options.meta as any)?.expandedCategories || expandedCategories;
      const setTableExpandedCategories =
        (table.options.meta as any)?.setExpandedCategories ||
        setExpandedCategories;

      const isExpanded = tableExpandedCategories.has(row.original.id);
      const hasChildren = row.original.hasChildren;
      const isChild = row.original.isChild;

      const toggleExpanded = () => {
        const newExpanded = new Set(tableExpandedCategories);
        if (isExpanded) {
          newExpanded.delete(row.original.id);
        } else {
          newExpanded.add(row.original.id);
        }
        setTableExpandedCategories(newExpanded);
      };

      return (
        <div className={cn("flex space-x-2 items-center", isChild && "ml-10")}>
          {hasChildren && !isChild && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={toggleExpanded}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          {!hasChildren && !isChild && <div className="w-4" />}
          <div
            className="size-3"
            style={{ backgroundColor: row.original.color ?? undefined }}
          />
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    hasChildren && !isChild
                      ? "cursor-pointer"
                      : "cursor-default",
                  )}
                  onClick={hasChildren && !isChild ? toggleExpanded : undefined}
                >
                  {row.getValue("name")}
                </span>
              </TooltipTrigger>
              <TooltipContent
                className="px-3 py-1.5 text-xs"
                side="right"
                sideOffset={10}
              >
                <CategoryTooltip category={row.original} />
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {row.original.system && (
            <div className="pl-2">
              <span className="border border-border rounded-full py-1 px-2 text-[10px] text-[#878787] font-mono">
                System
              </span>
            </div>
          )}
        </div>
      );
    },
  },
  {
    header: "Tax Type",
    accessorKey: "taxType",
    cell: ({ row }) =>
      row.getValue("taxType") ? getTaxTypeLabel(row.getValue("taxType")) : "-",
  },
  {
    header: "Tax Rate",
    accessorKey: "taxRate",
    cell: ({ row }) =>
      row.getValue("taxRate") ? `${row.getValue("taxRate")}%` : "-",
  },
  {
    header: () => <span className="whitespace-nowrap">Report Code</span>,
    accessorKey: "taxReportingCode",
    cell: ({ row }) => row.getValue("taxReportingCode") || "-",
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const [isEditOpen, setIsEditOpen] = React.useState(false);

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                Edit
              </DropdownMenuItem>

              {!row.original.system && (
                <DropdownMenuItem
                  onClick={() =>
                    table.options.meta?.deleteCategory?.(row.original.id)
                  }
                >
                  Remove
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <EditCategoryModal
            id={row.original.id}
            defaultValue={{
              ...row.original,
              color: row.original.color || null,
              description: row.original.description || null,
              taxRate: row.original.taxRate || null,
              taxType: row.original.taxType || null,
              taxReportingCode: row.original.taxReportingCode || null,
              excluded: row.original.excluded || null,
              parentId: row.original.parentId || null,
            }}
            isOpen={isEditOpen}
            onOpenChange={setIsEditOpen}
          />
        </div>
      );
    },
  },
];
