import { create } from "zustand";

type Result = {
  totalItems: number;
  fullPath: string;
  filePath: string;
};

interface ExportState {
  exportData?: {
    progress?: number;
    status?: string;
    result?: Result;
  };
  setExportData: (exportData?: {
    progress?: number;
    status?: string;
    result?: Result;
  }) => void;
}

export const useExportStore = create<ExportState>()((set) => ({
  exportData: undefined,
  setExportData: (exportData) => set({ exportData }),
}));
