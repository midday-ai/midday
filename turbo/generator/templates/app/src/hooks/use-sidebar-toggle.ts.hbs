import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Interface representing the state of the sidebar.
 */
export interface SidebarState {
  /** Indicates whether the sidebar is open or closed. */
  isOpen: boolean;
  /** Function to toggle the sidebar's open/closed state. */
  setIsOpen: () => void;
}

/**
 * Custom hook for managing the sidebar toggle state.
 * Uses Zustand for state management and persists the state in localStorage.
 */
export const useSidebarToggle = create(
  persist<SidebarState>(
    (set, get) => ({
      isOpen: true,
      setIsOpen: () => {
        set({ isOpen: !get().isOpen });
      },
    }),
    {
      name: "sidebarOpen",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
