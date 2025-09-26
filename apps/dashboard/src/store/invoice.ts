import type { Column, RowSelectionState, Updater } from "@tanstack/react-table";
import { create } from "zustand";

interface InvoiceState {
  columns: Column<any, unknown>[];
  setColumns: (columns?: Column<any, unknown>[]) => void;
  setRowSelection: (updater: Updater<RowSelectionState>) => void;
  rowSelection: Record<string, boolean>;
}

export const useInvoiceStore = create<InvoiceState>()((set) => ({
  columns: [],
  rowSelection: {},
  setColumns: (columns) => set({ columns: columns || [] }),
  setRowSelection: (updater: Updater<RowSelectionState>) =>
    set((state) => {
      return {
        rowSelection:
          typeof updater === "function" ? updater(state.rowSelection) : updater,
      };
    }),
}));
