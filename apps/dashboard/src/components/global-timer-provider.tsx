"use client";

import { useGlobalTimerStatus } from "@/hooks/use-global-timer-status";

export function GlobalTimerProvider() {
  // This hook handles all the global timer status updates
  useGlobalTimerStatus();

  // This component doesn't render anything, it just runs the hook
  return null;
}
