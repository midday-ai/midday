import { create } from "zustand";

export enum MenuOption {
  Root = "root",
  RootDesktop = "root-desktop",
  Tracker = "tracker",
  AI = "ai",
}

interface CommandState {
  isOpen: boolean;
  setOpen: (menu?: MenuOption) => void;
  setMenu: (menu: MenuOption) => void;
  selected: MenuOption;
}

export const useCommandStore = create<CommandState>()((set) => ({
  isOpen: false,
  selected: undefined,
  setOpen: (selected) => set((state) => ({ isOpen: !state.isOpen, selected })),
  setMenu: (selected) => set({ selected }),
}));
