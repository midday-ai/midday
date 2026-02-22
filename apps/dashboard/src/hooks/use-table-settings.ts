"use client";

import type {
  ColumnOrderState,
  ColumnSizingState,
  VisibilityState,
} from "@tanstack/react-table";
import { useCallback, useEffect, useRef, useState } from "react";
import { updateTableSettingsAction } from "@/actions/update-table-settings-action";
import {
  mergeWithDefaults,
  normalizeColumnOrder,
  TABLE_SETTINGS_COOKIE,
  type TableId,
  type TableSettings,
} from "@/utils/table-settings";

interface UseTableSettingsProps {
  tableId: TableId;
  initialSettings?: Partial<TableSettings>;
  columnIds?: string[];
}

interface UseTableSettingsReturn {
  columnVisibility: VisibilityState;
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>;
  columnSizing: ColumnSizingState;
  setColumnSizing: React.Dispatch<React.SetStateAction<ColumnSizingState>>;
  columnOrder: ColumnOrderState;
  setColumnOrder: React.Dispatch<React.SetStateAction<ColumnOrderState>>;
}

/**
 * Hook for managing table column settings (visibility, sizing, order)
 * with automatic persistence to a single unified cookie.
 */
export function useTableSettings({
  tableId,
  initialSettings,
  columnIds,
}: UseTableSettingsProps): UseTableSettingsReturn {
  // Merge initial settings with defaults
  const settings = mergeWithDefaults(initialSettings, tableId);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    settings.columns,
  );
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(
    settings.sizing,
  );
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(
    columnIds
      ? normalizeColumnOrder(settings.order, columnIds)
      : settings.order,
  );

  // Track initial mount to skip first persist
  const isInitialMount = useRef(true);

  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist settings to unified cookie
  const persistSettings = useCallback(
    (
      visibility: VisibilityState,
      sizing: ColumnSizingState,
      order: ColumnOrderState,
    ) => {
      // Clear existing debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce persistence to avoid excessive cookie writes during resize
      debounceRef.current = setTimeout(async () => {
        try {
          // Read current cookie value to preserve other table settings
          const existingCookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith(`${TABLE_SETTINGS_COOKIE}=`));

          let allSettings: Record<string, Partial<TableSettings>> = {};
          if (existingCookie) {
            try {
              allSettings = JSON.parse(
                decodeURIComponent(existingCookie.split("=")[1] ?? "{}"),
              );
            } catch {
              // Invalid JSON, start fresh
              allSettings = {};
            }
          }

          // Update only this table's settings
          allSettings[tableId] = {
            columns: visibility,
            sizing: sizing,
            order: order,
          };

          // Persist to server action (which sets the cookie)
          await updateTableSettingsAction({
            key: TABLE_SETTINGS_COOKIE,
            data: allSettings,
          });
        } catch (error) {
          console.error("Failed to persist table settings:", error);
        }
      }, 300);
    },
    [tableId],
  );

  // Effect to persist changes (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    persistSettings(columnVisibility, columnSizing, columnOrder);
  }, [columnVisibility, columnSizing, columnOrder, persistSettings]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    columnVisibility,
    setColumnVisibility,
    columnSizing,
    setColumnSizing,
    columnOrder,
    setColumnOrder,
  };
}
