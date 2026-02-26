import { create } from "zustand";

type ReconciliationState = {
  activeSessionId: string | null;
  selectedTransactionIds: string[];
  activeTab: "feed" | "reconcile" | "discrepancies";
  setActiveSessionId: (id: string | null) => void;
  setSelectedTransactionIds: (ids: string[]) => void;
  toggleTransactionId: (id: string) => void;
  clearSelection: () => void;
  setActiveTab: (tab: "feed" | "reconcile" | "discrepancies") => void;
};

export const useReconciliationStore = create<ReconciliationState>((set) => ({
  activeSessionId: null,
  selectedTransactionIds: [],
  activeTab: "feed",
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  setSelectedTransactionIds: (ids) => set({ selectedTransactionIds: ids }),
  toggleTransactionId: (id) =>
    set((state) => ({
      selectedTransactionIds: state.selectedTransactionIds.includes(id)
        ? state.selectedTransactionIds.filter((i) => i !== id)
        : [...state.selectedTransactionIds, id],
    })),
  clearSelection: () => set({ selectedTransactionIds: [] }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
