"use client";

import { useTimerStore } from "@/store/timer";

/**
 * Hook to access global timer status from Zustand store.
 * The interval is managed centrally by GlobalTimerProvider,
 * so this hook just reads the current state.
 */
export function useGlobalTimerStatus() {
  const isRunning = useTimerStore((state) => state.isRunning);
  const elapsedTime = useTimerStore((state) => state.elapsedTime);
  const currentProject = useTimerStore((state) => state.projectName);
  const projectId = useTimerStore((state) => state.projectId);

  return {
    isRunning,
    elapsedTime,
    currentProject,
    projectId,
  };
}
