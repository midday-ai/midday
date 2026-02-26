import type { Column } from "@tanstack/react-table";
import { create } from "zustand";

interface MerchantsState {
  columns: Column<any, unknown>[];
  setColumns: (columns?: Column<any, unknown>[]) => void;
}

export const useMerchantsStore = create<MerchantsState>()((set) => ({
  columns: [],
  setColumns: (columns) => set({ columns: columns || [] }),
}));
