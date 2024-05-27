import { create } from "zustand";

interface AssistantState {
  isOpen: boolean;
  setOpen: () => void;
}

export const useAssistantStore = create<AssistantState>()((set) => ({
  isOpen: false,
  setOpen: () => set((state) => ({ isOpen: !state.isOpen })),
}));
