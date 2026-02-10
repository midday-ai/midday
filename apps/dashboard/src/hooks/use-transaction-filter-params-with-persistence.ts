"use client";

import { useCallback } from "react";
import {
  EMPTY_FILTER_STATE,
  type FilterHookReturn,
  type TransactionFilters,
} from "@/utils/transaction-filters";
import { useTransactionFilterParams } from "./use-transaction-filter-params";

export function useTransactionFilterParamsWithPersistence(): FilterHookReturn<TransactionFilters> {
  const { filter, setFilter, hasFilters } = useTransactionFilterParams();

  const clearAllFilters = useCallback(() => {
    setFilter(EMPTY_FILTER_STATE);
  }, [setFilter]);

  return {
    filter,
    setFilter,
    hasFilters,
    clearAllFilters,
  };
}
