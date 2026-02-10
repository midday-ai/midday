"use client";

import { cn } from "@midday/ui/cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";
import { useCategoryParams } from "@/hooks/use-category-params";
import { useTRPC } from "@/trpc/client";
import {
  type CategoriesTableMeta,
  columns,
  flattenCategories,
} from "./columns";
import { Header } from "./header";

export function DataTable() {
  const [expandedCategories, setExpandedCategories] = React.useState<
    Set<string>
  >(new Set());

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setParams } = useCategoryParams();

  const { data } = useSuspenseQuery(
    trpc.transactionCategories.get.queryOptions(),
  );

  const deleteCategoryMutation = useMutation(
    trpc.transactionCategories.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactionCategories.get.queryKey(),
        });
      },
    }),
  );

  // Flatten categories - include all parents and all children
  const flattenedData = React.useMemo(() => {
    return flattenCategories(data ?? []);
  }, [data]);

  // Get search filter value
  const [searchValue, setSearchValue] = React.useState<string>("");

  // Create a map of parent IDs to their children for efficient lookup
  const childrenByParentId = React.useMemo(() => {
    const map = new Map<string, typeof flattenedData>();
    for (const category of flattenedData) {
      if (category.isChild && category.parentId) {
        if (!map.has(category.parentId)) {
          map.set(category.parentId, []);
        }
        map.get(category.parentId)!.push(category);
      }
    }
    return map;
  }, [flattenedData]);

  // Custom filter function that handles expanded state and search
  const filteredData = React.useMemo(() => {
    if (!searchValue) {
      // No search: only show parents and children of expanded parents
      return flattenedData.filter((category) => {
        if (!category.isChild) {
          return true; // Always show parents
        }
        // Only show children if their parent is expanded
        return category.parentId && expandedCategories.has(category.parentId);
      });
    }

    // With search: show only categories that match the search
    // Parents are shown if they match OR if they have matching children
    // Children are only shown if they match the search
    const searchLower = searchValue.toLowerCase();

    return flattenedData.filter((category) => {
      const matchesSearch = category.name?.toLowerCase().includes(searchLower);

      if (!category.isChild) {
        // Check if any children match
        const children = childrenByParentId.get(category.id) || [];
        const hasMatchingChild = children.some((child) =>
          child.name?.toLowerCase().includes(searchLower),
        );

        // Show parent if it matches OR has matching children
        return matchesSearch || hasMatchingChild;
      }

      // For children: only show if they match the search
      return matchesSearch;
    });
  }, [flattenedData, expandedCategories, searchValue, childrenByParentId]);

  const tableMeta: CategoriesTableMeta = {
    deleteCategory: (id: string) => {
      deleteCategoryMutation.mutate({ id });
    },
    onEdit: (id: string) => {
      setParams({ categoryId: id });
    },
    expandedCategories,
    setExpandedCategories,
    searchValue,
    setSearchValue,
  };

  const table = useReactTable({
    data: filteredData,
    getRowId: ({ id }) => id,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualFiltering: true, // We handle filtering manually
    meta: tableMeta,
  });

  return (
    <div className="w-full">
      <Header table={table} />

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              className="hover:bg-muted/50 cursor-pointer"
              key={row.id}
              onClick={() => setParams({ categoryId: row.original.id })}
            >
              {row.getVisibleCells().map((cell, index) => (
                <TableCell
                  key={cell.id}
                  className={cn(index === 3 && "w-[50px]")}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
