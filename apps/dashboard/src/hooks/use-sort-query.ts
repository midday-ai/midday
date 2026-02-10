"use client";

import { useCallback } from "react";
import { useSortParams } from "@/hooks/use-sort-params";

/**
 * Hook for managing sort query state
 * Provides the current sort state and a function to toggle sort direction
 */
export function useSortQuery() {
  const { params, setParams } = useSortParams();
  const [sortColumn, sortValue] = params.sort || [];

  /**
   * Toggle sort for a column
   * Cycles through: asc -> desc -> clear
   */
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

  return {
    /** Current sort column name */
    sortColumn,
    /** Current sort direction: "asc" | "desc" | undefined */
    sortValue,
    /** Function to toggle sort for a column */
    createSortQuery,
  };
}
