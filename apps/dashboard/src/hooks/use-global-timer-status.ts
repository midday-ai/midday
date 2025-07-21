"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

export function useGlobalTimerStatus() {
  const trpc = useTRPC();
  const originalTitleRef = useRef<string | undefined>(undefined);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [localElapsedSeconds, setLocalElapsedSeconds] = useState(0);

  // Get current timer status (only initial fetch, no automatic refetching)
  const { data: timerStatus } = useQuery({
    ...trpc.trackerEntries.getTimerStatus.queryOptions(),
    refetchInterval: false, // Don't refetch automatically
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Store original title on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Store original title
    if (!originalTitleRef.current) {
      originalTitleRef.current = document.title;
    }
  }, []);

  // Manage local timer interval
  useEffect(() => {
    const isRunning = timerStatus?.isRunning;

    if (isRunning) {
      // Reset local counter when timer status changes
      setLocalElapsedSeconds(0);

      // Start local interval to increment every second
      intervalRef.current = setInterval(() => {
        setLocalElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      // Clear interval and reset local counter when not running
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setLocalElapsedSeconds(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerStatus?.isRunning, timerStatus?.elapsedTime]);

  // Update title based on timer status
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isRunning = timerStatus?.isRunning;
    const serverElapsedTime = timerStatus?.elapsedTime || 0;
    const totalElapsedTime = serverElapsedTime + localElapsedSeconds;
    const projectName = timerStatus?.currentEntry?.trackerProject?.name;

    if (isRunning && projectName) {
      // Format time as HH:MM:SS for document title
      const hours = Math.floor(totalElapsedTime / 3600);
      const minutes = Math.floor((totalElapsedTime % 3600) / 60);
      const seconds = totalElapsedTime % 60;
      const timeDisplay = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

      // Update title with timer
      document.title = `${timeDisplay} • ${projectName} | Midday`;
    } else {
      // Restore original title
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
    }
  }, [
    timerStatus?.isRunning,
    timerStatus?.elapsedTime,
    timerStatus?.currentEntry?.trackerProject?.name,
    localElapsedSeconds,
  ]);

  const serverElapsedTime = timerStatus?.elapsedTime || 0;
  const totalElapsedTime = serverElapsedTime + localElapsedSeconds;

  return {
    isRunning: timerStatus?.isRunning || false,
    elapsedTime: totalElapsedTime,
    currentProject: timerStatus?.currentEntry?.trackerProject?.name,
  };
}
