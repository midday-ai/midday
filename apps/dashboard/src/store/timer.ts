import { create } from "zustand";

interface TimerState {
  // Timer state
  isRunning: boolean;
  elapsedTime: number;
  projectName: string | null;
  projectId: string | null;

  // Internal state
  _intervalId: NodeJS.Timeout | null;
  _originalTitle: string | null;

  // Actions
  setTimerStatus: (status: {
    isRunning: boolean;
    elapsedTime: number;
    projectName: string | null;
    projectId: string | null;
  }) => void;
  tick: () => void;
  startInterval: () => void;
  stopInterval: () => void;
  reset: () => void;
}

// Format time as HH:MM:SS for document title
const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

// Update document title (called from single interval only)
const updateTitle = (elapsedTime: number, projectName: string | null) => {
  if (typeof window === "undefined") return;
  if (projectName) {
    document.title = `${formatTime(elapsedTime)} • ${projectName} | Midday`;
  }
};

// Restore original title
const restoreTitle = (originalTitle: string | null) => {
  if (typeof window === "undefined") return;
  if (originalTitle) {
    document.title = originalTitle;
  }
};

export const useTimerStore = create<TimerState>()((set, get) => ({
  // Initial state
  isRunning: false,
  elapsedTime: 0,
  projectName: null,
  projectId: null,
  _intervalId: null,
  _originalTitle: null,

  setTimerStatus: (status) => {
    const { isRunning: wasRunning } = get();
    const { isRunning, elapsedTime, projectName, projectId } = status;

    set({ isRunning, elapsedTime, projectName, projectId });

    // Handle interval start/stop based on running state change
    if (isRunning && !wasRunning) {
      get().startInterval();
    } else if (!isRunning && wasRunning) {
      get().stopInterval();
    }

    // Update title immediately when status changes
    if (isRunning && projectName) {
      updateTitle(elapsedTime, projectName);
    }
  },

  tick: () => {
    const { isRunning, elapsedTime, projectName } = get();
    if (!isRunning) return;

    const newElapsedTime = elapsedTime + 1;
    set({ elapsedTime: newElapsedTime });

    // Update document title (single update per second)
    updateTitle(newElapsedTime, projectName);
  },

  startInterval: () => {
    const { _intervalId } = get();

    // Don't start if already running
    if (_intervalId) return;

    // Store original title
    if (typeof window !== "undefined") {
      set({ _originalTitle: document.title });
    }

    // Start the single interval
    const intervalId = setInterval(() => {
      get().tick();
    }, 1000);

    set({ _intervalId: intervalId });
  },

  stopInterval: () => {
    const { _intervalId, _originalTitle } = get();

    if (_intervalId) {
      clearInterval(_intervalId);
      set({ _intervalId: null });
    }

    // Restore original title
    restoreTitle(_originalTitle);
  },

  reset: () => {
    const { _intervalId, _originalTitle } = get();

    if (_intervalId) {
      clearInterval(_intervalId);
    }

    restoreTitle(_originalTitle);

    set({
      isRunning: false,
      elapsedTime: 0,
      projectName: null,
      projectId: null,
      _intervalId: null,
      _originalTitle: null,
    });
  },
}));
