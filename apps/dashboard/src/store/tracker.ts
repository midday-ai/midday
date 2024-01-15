import { create } from "zustand";

interface TrackerState {
  isTracking: boolean;
  setTracking: () => void;
}

export const useTrackerStore = create<TrackerState>()((set) => ({
  isTracking: false,
  setTracking: () => set((state) => ({ isTracking: !state.isTracking })),
}));
