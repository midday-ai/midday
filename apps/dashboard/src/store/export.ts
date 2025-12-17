import { create } from "zustand";

export type ExportType = "file" | "accounting";

interface ExportData {
  runId?: string;
  accessToken?: string;
  /** Type of export: "file" for vault storage, "accounting" for provider sync */
  exportType?: ExportType;
  /** Provider name for accounting exports (e.g., "Xero", "QuickBooks") */
  providerName?: string;
}

interface ExportState {
  exportData?: ExportData;
  isExporting: boolean;
  setExportData: (exportData?: ExportData) => void;
  setIsExporting: (isExporting: boolean) => void;
}

export const useExportStore = create<ExportState>()((set) => ({
  exportData: undefined,
  isExporting: false,
  setExportData: (exportData) => set({ exportData }),
  setIsExporting: (isExporting) => set({ isExporting }),
}));
