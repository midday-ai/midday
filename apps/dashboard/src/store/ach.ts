import { create } from "zustand";

type AchState = {
  draftBatchId: string | null;
  selectedDealIds: string[];
  wizardStep: number;
  setDraftBatchId: (id: string | null) => void;
  setSelectedDealIds: (ids: string[]) => void;
  toggleDealId: (id: string) => void;
  setWizardStep: (step: number) => void;
  reset: () => void;
};

export const useAchStore = create<AchState>((set) => ({
  draftBatchId: null,
  selectedDealIds: [],
  wizardStep: 1,
  setDraftBatchId: (id) => set({ draftBatchId: id }),
  setSelectedDealIds: (ids) => set({ selectedDealIds: ids }),
  toggleDealId: (id) =>
    set((state) => ({
      selectedDealIds: state.selectedDealIds.includes(id)
        ? state.selectedDealIds.filter((i) => i !== id)
        : [...state.selectedDealIds, id],
    })),
  setWizardStep: (step) => set({ wizardStep: step }),
  reset: () =>
    set({ draftBatchId: null, selectedDealIds: [], wizardStep: 1 }),
}));
