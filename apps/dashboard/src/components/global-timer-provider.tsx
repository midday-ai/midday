"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useTimerStore } from "@/store/timer";
import { useTRPC } from "@/trpc/client";

export function GlobalTimerProvider() {
  const trpc = useTRPC();
  const setTimerStatus = useTimerStore((state) => state.setTimerStatus);
  const lastSyncRef = useRef<string | null>(null);

  // Get current timer status from server
  const { data: timerStatus } = useQuery({
    ...trpc.trackerEntries.getTimerStatus.queryOptions(),
    refetchInterval: false,
    refetchOnWindowFocus: true, // Sync with server when tab regains focus
    staleTime: 5 * 60 * 1000,
  });

  // Sync server status to Zustand store
  useEffect(() => {
    if (timerStatus === undefined) return;

    const isRunning = timerStatus.isRunning ?? false;
    const elapsedTime = timerStatus.elapsedTime ?? 0;
    const projectName = timerStatus.currentEntry?.trackerProject?.name ?? null;
    const projectId = timerStatus.currentEntry?.projectId ?? null;

    // Only sync when data actually changes (prevents redundant updates from optimistic mutations)
    const syncKey = `${isRunning}-${projectId}-${elapsedTime}`;
    if (lastSyncRef.current === syncKey) return;
    lastSyncRef.current = syncKey;

    setTimerStatus({ isRunning, elapsedTime, projectName, projectId });
  }, [timerStatus, setTimerStatus]);

  return null;
}
