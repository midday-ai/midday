import { create } from "zustand";

export enum MenuOption {
  Navigation = "navigation",
  Tracker = "tracker",
}

interface CommandState {
  isOpen: boolean;
  setOpen: (menu?: MenuOption) => void;
  setMenu: (menu: MenuOption) => void;
  menu: MenuOption;
}

export const useCommandStore = create<CommandState>()((set) => ({
  isOpen: false,
  menu: MenuOption.Navigation,
  setOpen: (menu) => set((state) => ({ isOpen: !state.isOpen, menu })),
  setMenu: (menu) => set({ menu }),
}));
