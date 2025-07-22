"use client";

import { useTRPC } from "@/trpc/client";
import { secondsToHoursAndMinutes } from "@/utils/format";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useToast } from "@midday/ui/use-toast";
import NumberFlow from "@number-flow/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

interface TrackerTimerProps {
  projectId: string;
  projectName: string;
  initialDuration?: number;
  onClick?: () => void;
  alwaysShowButton?: boolean;
}

export function TrackerTimer({
  projectId,
  projectName,
  onClick,
  alwaysShowButton = false,
}: TrackerTimerProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [localElapsedSeconds, setLocalElapsedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Hold-to-stop state
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdProgressRef = useRef<NodeJS.Timeout | null>(null);

  // Get current timer status
  const { data: timerStatus } = useQuery({
    ...trpc.trackerEntries.getTimerStatus.queryOptions(),
    refetchInterval: (query) => {
      // Only refetch if there's a running timer
      return query.state.data?.isRunning ? 30000 : false; // Sync every 30 seconds when running
    },
  });

  // Check if this specific project is the one running
  const isThisProjectRunning =
    timerStatus?.isRunning &&
    timerStatus?.currentEntry?.projectId === projectId;

  // Start timer mutation
  const startTimerMutation = useMutation(
    trpc.trackerEntries.startTimer.mutationOptions({
      onMutate: async (variables) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({
          queryKey: trpc.trackerEntries.getTimerStatus.queryKey(),
        });

        // Optimistically update to the new value
        queryClient.setQueryData(
          trpc.trackerEntries.getTimerStatus.queryKey(),
          (old: any) => ({
            ...old,
            isRunning: true,
            currentEntry: {
              ...old?.currentEntry,
              projectId: variables.projectId,
            },
            elapsedTime: 0,
          }),
        );
      },
      onSuccess: () => {
        // Invalidate queries to sync with server
        queryClient.invalidateQueries({
          queryKey: trpc.trackerEntries.getTimerStatus.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.trackerEntries.getCurrentTimer.queryKey(),
        });
      },
    }),
  );

  // Stop timer mutation
  const stopTimerMutation = useMutation(
    trpc.trackerEntries.stopTimer.mutationOptions({
      onMutate: async () => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({
          queryKey: trpc.trackerEntries.getTimerStatus.queryKey(),
        });

        // Capture elapsed time and project name before stopping
        const currentElapsedTime = totalElapsedSeconds;
        const currentProjectName = projectName;

        // Optimistically update to stop the timer
        queryClient.setQueryData(
          trpc.trackerEntries.getTimerStatus.queryKey(),
          (old: any) => ({
            ...old,
            isRunning: false,
            currentEntry: null,
            elapsedTime: 0,
          }),
        );

        return { currentElapsedTime, currentProjectName };
      },
      onSuccess: (_, __, context) => {
        // Invalidate queries to sync with server
        queryClient.invalidateQueries({
          queryKey: trpc.trackerEntries.getTimerStatus.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.trackerEntries.getCurrentTimer.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.trackerEntries.byDate.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.trackerEntries.byRange.queryKey(),
        });

        toast({
          title: "Timer stopped",
          description: `${secondsToHoursAndMinutes(context?.currentElapsedTime)} added to ${context?.currentProjectName}`,
          variant: "success",
        });
      },
    }),
  );

  // Calculate total elapsed time (server elapsed + local increment)
  const totalElapsedSeconds =
    (timerStatus?.elapsedTime || 0) + localElapsedSeconds;

  // Hold-to-stop handlers
  const startHolding = () => {
    if (!isThisProjectRunning) return;

    setIsHolding(true);
    setHoldProgress(0);

    // Start progress animation
    let progress = 0;
    holdProgressRef.current = setInterval(() => {
      progress += 100 / 15; // 15 steps over 1.5 seconds = 100ms intervals
      setHoldProgress(Math.min(progress, 100));
    }, 100);

    // Execute stop after 1.5 seconds
    holdTimerRef.current = setTimeout(() => {
      stopTimerMutation.mutate({});
      resetHold();
    }, 1500);
  };

  const resetHold = () => {
    setIsHolding(false);
    setHoldProgress(0);

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (holdProgressRef.current) {
      clearInterval(holdProgressRef.current);
      holdProgressRef.current = null;
    }
  };

  // Manage local timer interval
  useEffect(() => {
    if (isThisProjectRunning) {
      // Reset local counter when starting
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
  }, [isThisProjectRunning]);

  // Reset local elapsed when timer status changes
  useEffect(() => {
    if (
      timerStatus?.isRunning &&
      timerStatus?.currentEntry?.projectId === projectId
    ) {
      setLocalElapsedSeconds(0);
    }
  }, [timerStatus?.elapsedTime, projectId]);

  // Cleanup hold timers on unmount
  useEffect(() => {
    return () => {
      resetHold();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    // For durations less than 1 hour, show only minutes and seconds
    if (hours === 0) {
      return { showHours: false, minutes, seconds: secs };
    }

    return { showHours: true, hours, minutes, seconds: secs };
  };

  const handleButtonClick = () => {
    if (!isThisProjectRunning) {
      // Start timer for this project
      startTimerMutation.mutate({
        projectId,
      });
    }
    // For stop, we only use hold-to-stop, so no immediate action
  };

  return (
    <div className="flex items-center">
      <div className="relative">
        <TooltipProvider delayDuration={20}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={`p-1 h-6 rounded transition-all text-[#666] duration-200 ease-in-out hover:bg-accent flex items-center justify-center overflow-hidden ${
                  isThisProjectRunning
                    ? "w-6 mr-1 opacity-100 scale-100"
                    : alwaysShowButton
                      ? "w-6 mr-1 opacity-100 scale-100"
                      : "w-0 mr-0 opacity-0 scale-75 group-hover:w-6 group-hover:mr-1 group-hover:opacity-100 group-hover:scale-100"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleButtonClick();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (isThisProjectRunning) {
                    startHolding();
                  }
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  resetHold();
                }}
                onMouseLeave={(e) => {
                  e.stopPropagation();
                  resetHold();
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  if (isThisProjectRunning) {
                    startHolding();
                  }
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  resetHold();
                }}
              >
                {isThisProjectRunning ? (
                  <Icons.StopOutline size={18} />
                ) : (
                  <Icons.PlayOutline size={18} />
                )}
              </button>
            </TooltipTrigger>
            {isThisProjectRunning && (
              <TooltipContent
                side="top"
                sideOffset={5}
                className="text-xs px-2 py-1 text-[#878787]"
              >
                <p>Hold down to stop</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {/* Circular Progress Bar */}
        {isHolding && isThisProjectRunning && (
          <svg
            className="absolute inset-0 w-6 h-6 -rotate-90 pointer-events-none"
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-primary opacity-30"
            />
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="text-primary"
              style={{
                strokeDasharray: "62.83", // 2 * π * 10
                strokeDashoffset: 62.83 * (1 - holdProgress / 100),
                transition: "stroke-dashoffset 100ms linear",
              }}
            />
          </svg>
        )}
      </div>

      <div className="cursor-pointer flex-1" onClick={onClick}>
        <div className="flex items-center gap-2">
          <span>{projectName}</span>
          <div
            className={`flex items-center gap-px font-mono text-xs text-[#666] ml-auto transition-all duration-300 ease-in-out ${
              isThisProjectRunning
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2"
            }`}
          >
            {isThisProjectRunning && (
              <>
                <div className="flex items-center mr-[5px]">
                  <span className="relative flex h-[5px] w-[5px]">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C969] opacity-75" />
                    <span className="relative inline-flex rounded-full h-[5px] w-[5px] bg-[#00C969]" />
                  </span>
                </div>
                <NumberFlow
                  value={formatTime(totalElapsedSeconds).hours ?? 0}
                  format={{ minimumIntegerDigits: 2 }}
                />
                <span>:</span>
                <NumberFlow
                  value={formatTime(totalElapsedSeconds).minutes}
                  format={{ minimumIntegerDigits: 2 }}
                />
                <span>:</span>
                <NumberFlow
                  value={formatTime(totalElapsedSeconds).seconds}
                  format={{ minimumIntegerDigits: 2 }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
