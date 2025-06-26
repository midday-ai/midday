"use client";

import {
  EMPTY_FILTER_STATE,
  type FilterHookReturn,
  type TransactionFilters,
} from "@/utils/transaction-filters";
import { useGenericFilterPersistence } from "./use-generic-filter-persistence";
import { useTransactionFilterParams } from "./use-transaction-filter-params";

export function useTransactionFilterParamsWithPersistence(): FilterHookReturn<TransactionFilters> {
  const { filter, setFilter, hasFilters } = useTransactionFilterParams();

  const { clearAllFilters } = useGenericFilterPersistence({
    storageKey: "transaction-filters",
    emptyState: EMPTY_FILTER_STATE,
    currentFilters: filter,
    setFilters: setFilter,
  });

  return {
    filter,
    setFilter,
    hasFilters,
    clearAllFilters,
  };
}
