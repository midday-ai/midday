import type { Column } from "@tanstack/react-table";
import { create } from "zustand";

interface CustomersState {
  columns: Column<any, unknown>[];
  setColumns: (columns?: Column<any, unknown>[]) => void;
}

export const useCustomersStore = create<CustomersState>()((set) => ({
  columns: [],
  setColumns: (columns) => set({ columns: columns || [] }),
}));
