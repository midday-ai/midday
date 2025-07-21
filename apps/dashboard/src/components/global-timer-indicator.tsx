"use client";

import { useGlobalTimerStatus } from "@/hooks/use-global-timer-status";
import { secondsToHoursAndMinutes } from "@/utils/format";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";

interface GlobalTimerIndicatorProps {
  className?: string;
}

export function GlobalTimerIndicator({ className }: GlobalTimerIndicatorProps) {
  const { isRunning, elapsedTime, currentProject } = useGlobalTimerStatus();

  if (!isRunning || !currentProject) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md text-sm",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <Icons.PlayOutline
            size={14}
            className="text-green-600 dark:text-green-400"
          />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
        </div>
        <span className="font-mono text-green-700 dark:text-green-300">
          {secondsToHoursAndMinutes(elapsedTime)}
        </span>
        <span className="text-green-600 dark:text-green-400 truncate max-w-[120px]">
          {currentProject}
        </span>
      </div>
    </div>
  );
}
