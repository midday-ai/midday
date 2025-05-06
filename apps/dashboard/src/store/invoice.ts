import type { Column } from "@tanstack/react-table";
import { create } from "zustand";

interface InvoiceState {
  columns: Column<any, unknown>[];
  setColumns: (columns?: Column<any, unknown>[]) => void;
}

export const useInvoiceStore = create<InvoiceState>()((set) => ({
  columns: [],
  setColumns: (columns) => set({ columns: columns || [] }),
}));
