import { create } from "zustand";

interface InboxState {
  selectedIds: Record<string, boolean>;
  lastClickedIndex: number | null;
  setSelectedIds: (ids: Record<string, boolean>) => void;
  toggleSelection: (id: string) => void;
  selectRange: (
    startIndex: number,
    endIndex: number,
    items: Array<{ id: string }>,
  ) => void;
  clearSelection: () => void;
  setLastClickedIndex: (index: number | null) => void;
}

export const useInboxStore = create<InboxState>()((set, get) => ({
  selectedIds: {},
  lastClickedIndex: null,
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  toggleSelection: (id) =>
    set((state) => {
      const newSelectedIds = { ...state.selectedIds };
      if (newSelectedIds[id]) {
        delete newSelectedIds[id];
      } else {
        newSelectedIds[id] = true;
      }
      return { selectedIds: newSelectedIds };
    }),
  selectRange: (startIndex, endIndex, items) => {
    const start = Math.min(startIndex, endIndex);
    const end = Math.max(startIndex, endIndex);
    const currentSelectedIds = get().selectedIds;
    const newSelectedIds = { ...currentSelectedIds };

    // Check if all items in range are already selected
    let allSelected = true;
    for (let i = start; i <= end; i++) {
      const item = items[i];
      if (item && !currentSelectedIds[item.id]) {
        allSelected = false;
        break;
      }
    }

    // Toggle: if all selected, deselect; otherwise select all
    for (let i = start; i <= end; i++) {
      const item = items[i];
      if (item) {
        if (allSelected) {
          delete newSelectedIds[item.id];
        } else {
          newSelectedIds[item.id] = true;
        }
      }
    }

    set({ selectedIds: newSelectedIds });
  },
  clearSelection: () => set({ selectedIds: {}, lastClickedIndex: null }),
  setLastClickedIndex: (index) => set({ lastClickedIndex: index }),
}));
