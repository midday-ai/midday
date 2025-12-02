import type { Column, RowSelectionState, Updater } from "@tanstack/react-table";
import { create } from "zustand";

interface TransactionsState {
  canDelete?: boolean;
  columns: Column<any, unknown>[];
  setColumns: (columns?: Column<any, unknown>[]) => void;
  setCanDelete: (canDelete?: boolean) => void;
  setRowSelection: (updater: Updater<RowSelectionState>) => void;
  rowSelection: Record<string, boolean>;
  lastClickedIndex: number | null;
  setLastClickedIndex: (index: number | null) => void;
}

export const useTransactionsStore = create<TransactionsState>()((set) => ({
  columns: [],
  canDelete: false,
  rowSelection: {},
  lastClickedIndex: null,
  setCanDelete: (canDelete) => set({ canDelete }),
  setColumns: (columns) => set({ columns: columns || [] }),
  setRowSelection: (updater: Updater<RowSelectionState>) =>
    set((state) => {
      return {
        rowSelection:
          typeof updater === "function" ? updater(state.rowSelection) : updater,
      };
    }),
  setLastClickedIndex: (index) => set({ lastClickedIndex: index }),
}));
