"use client";

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
import type { Dispatch, SetStateAction } from "react";
import { useI18n } from "@/locales/client";

export interface CategoriesTableMeta {
  deleteCategory: (id: string) => void;
  onEdit: (id: string) => void;
  expandedCategories: Set<string>;
  setExpandedCategories: Dispatch<SetStateAction<Set<string>>>;
  searchValue?: string;
  setSearchValue?: Dispatch<SetStateAction<string>>;
}

export type Category = RouterOutputs["transactionCategories"]["get"][number];

// Check if a category should show a tooltip
function shouldShowCategoryTooltip(category: any): boolean {
  // Show tooltip if category has a user-defined description
  if (category.description) {
    return true;
  }
  // Show tooltip for system categories (they have localized descriptions)
  if (category.system) {
    return true;
  }
  // Don't show tooltip for user-created categories without descriptions
  return false;
}

// Component to display category description from localization
function CategoryTooltip({ category }: { category: any }) {
  const t = useI18n();

  // Priority 1: User-defined description
  if (category.description) {
    return <span>{category.description}</span>;
  }

  // Priority 2: System description from localization (only for system categories)
  if (category.system) {
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

  return null;
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
      // Get expanded state from table meta
      const meta = table.options.meta as CategoriesTableMeta;
      const tableExpandedCategories = meta?.expandedCategories || new Set();
      const setTableExpandedCategories = meta?.setExpandedCategories;

      const isExpanded = tableExpandedCategories.has(row.original.id);
      const hasChildren = row.original.hasChildren;
      const isChild = row.original.isChild;

      const toggleExpanded = () => {
        if (!setTableExpandedCategories) return;

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
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded();
              }}
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
          {shouldShowCategoryTooltip(row.original) ? (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={cn(
                      hasChildren && !isChild
                        ? "cursor-pointer"
                        : "cursor-default",
                    )}
                    onClick={
                      hasChildren && !isChild
                        ? (e) => {
                            e.stopPropagation();
                            toggleExpanded();
                          }
                        : undefined
                    }
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
          ) : (
            <span
              className={cn(
                hasChildren && !isChild ? "cursor-pointer" : "cursor-default",
              )}
              onClick={
                hasChildren && !isChild
                  ? (e) => {
                      e.stopPropagation();
                      toggleExpanded();
                    }
                  : undefined
              }
            >
              {row.getValue("name")}
            </span>
          )}

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
      const meta = table.options.meta as CategoriesTableMeta;

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem onClick={() => meta?.onEdit?.(row.original.id)}>
                Edit
              </DropdownMenuItem>

              {!row.original.system && (
                <DropdownMenuItem
                  onClick={() => meta?.deleteCategory?.(row.original.id)}
                >
                  Remove
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
