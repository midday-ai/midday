import { create } from "zustand";

interface ExportState {
  exportData?: {
    runId?: string;
    accessToken?: string;
  };
  setExportData: (exportData?: {
    runId?: string;
    accessToken?: string;
  }) => void;
}

export const useExportStore = create<ExportState>()((set) => ({
  exportData: undefined,
  setExportData: (exportData) => set({ exportData }),
}));
