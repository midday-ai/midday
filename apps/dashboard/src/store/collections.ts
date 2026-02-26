import type { Column } from "@tanstack/react-table";
import { create } from "zustand";

interface CollectionsState {
  columns: Column<any, unknown>[];
  setColumns: (columns?: Column<any, unknown>[]) => void;
}

export const useCollectionsStore = create<CollectionsState>()((set) => ({
  columns: [],
  setColumns: (columns) => set({ columns: columns || [] }),
}));
