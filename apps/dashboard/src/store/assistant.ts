import { create } from "zustand";

interface AssistantState {
  isOpen: boolean;
  message?: string;
  setOpen: (message?: string) => void;
}

export const useAssistantStore = create<AssistantState>()((set) => ({
  isOpen: false,
  message: undefined,
  setOpen: (message) => set((state) => ({ isOpen: !state.isOpen, message })),
}));
