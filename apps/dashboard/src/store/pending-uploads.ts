import { create } from "zustand";

interface PendingItem {
  pending: boolean;
  isMatch: boolean;
}

interface PendingUploadsState {
  /** Inbox IDs being tracked: { id: { pending, isMatch } } */
  pendingIds: Record<string, PendingItem>;
  /** Total count of items across all upload sessions */
  totalCount: number;
  /** Add new pending inbox IDs (merges with existing) */
  addPending: (ids: string[]) => void;
  /** Mark an inbox item as complete */
  markComplete: (id: string, isMatch: boolean) => void;
  /** Reset all state */
  reset: () => void;
  /** Get current state snapshot */
  getState: () => {
    isAllComplete: boolean;
    hasPending: boolean;
    matchCount: number;
    totalCount: number;
  };
}

export const usePendingUploadsStore = create<PendingUploadsState>()(
  (set, get) => ({
    pendingIds: {},
    totalCount: 0,

    addPending: (ids) =>
      set((state) => {
        const newItems = Object.fromEntries(
          ids.map((id) => [id, { pending: true, isMatch: false }]),
        );
        return {
          pendingIds: { ...state.pendingIds, ...newItems },
          totalCount: state.totalCount + ids.length,
        };
      }),

    markComplete: (id, isMatch) =>
      set((state) => {
        const item = state.pendingIds[id];
        if (!item || !item.pending) {
          return state;
        }
        return {
          pendingIds: {
            ...state.pendingIds,
            [id]: { pending: false, isMatch },
          },
        };
      }),

    reset: () =>
      set({
        pendingIds: {},
        totalCount: 0,
      }),

    getState: () => {
      const { pendingIds, totalCount } = get();
      if (totalCount === 0) {
        return {
          isAllComplete: false,
          hasPending: false,
          matchCount: 0,
          totalCount: 0,
        };
      }

      const items = Object.values(pendingIds);
      const isAllComplete = !items.some((item) => item.pending);
      const matchCount = items.filter(
        (item) => !item.pending && item.isMatch,
      ).length;

      return {
        isAllComplete,
        hasPending: true,
        matchCount,
        totalCount,
      };
    },
  }),
);
