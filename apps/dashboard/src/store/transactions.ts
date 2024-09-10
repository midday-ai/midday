import type { RowSelectionState, Updater } from "@tanstack/react-table";
import { create } from "zustand";

interface TransactionsState {
  canDelete?: boolean;
  columns: string[];
  setColumns: (columns?: string[]) => void;
  setCanDelete: (canDelete?: boolean) => void;
  setRowSelection: (updater: Updater<RowSelectionState>) => void;
  rowSelection: Record<string, boolean>;
}

export const useTransactionsStore = create<TransactionsState>()((set) => ({
  columns: [],
  canDelete: false,
  rowSelection: {},
  setCanDelete: (canDelete) => set({ canDelete }),
  setColumns: (columns) => set({ columns }),
  setRowSelection: (updater: Updater<RowSelectionState>) =>
    set((state) => {
      return {
        rowSelection:
          typeof updater === "function" ? updater(state.rowSelection) : updater,
      };
    }),
}));
