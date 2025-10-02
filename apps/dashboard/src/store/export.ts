import { create } from "zustand";

interface ExportState {
  exportData?: {
    runId?: string;
    accessToken?: string;
  };
  isExporting: boolean;
  setExportData: (exportData?: {
    runId?: string;
    accessToken?: string;
  }) => void;
  setIsExporting: (isExporting: boolean) => void;
}

export const useExportStore = create<ExportState>()((set) => ({
  exportData: undefined,
  isExporting: false,
  setExportData: (exportData) => set({ exportData }),
  setIsExporting: (isExporting) => set({ isExporting }),
}));
