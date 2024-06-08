import { create } from "zustand";

interface ExportState {
  exportId?: string;
  setExportId: (exportId?: string) => void;
}

export const useExportStore = create<ExportState>()((set) => ({
  exportId: undefined,
  setExportId: (exportId) => set({ exportId }),
}));
