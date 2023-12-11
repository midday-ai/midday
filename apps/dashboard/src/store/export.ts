import { create } from "zustand";

interface ExportState {
  exportId?: string;
  // totalItems?: number;
  setExportId: (exportId?: string) => void;
  // setTotalItems: (items: number) => void;
}

export const useExportStore = create<ExportState>()((set) => ({
  exportId: undefined,
  // totalItems: 0,
  setExportId: (exportId) => set({ exportId }),
  // setTotalItems: (totalItems) => set({ totalItems }),
}));
