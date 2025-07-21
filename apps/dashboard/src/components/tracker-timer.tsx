"use client";

import { useTRPC } from "@/trpc/client";
import { secondsToHoursAndMinutes } from "@/utils/format";
import { Icons } from "@midday/ui/icons";
import { useToast } from "@midday/ui/use-toast";
import NumberFlow from "@number-flow/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

interface TrackerTimerProps {
  projectId: string;
  projectName: string;
  initialDuration?: number;
  onClick?: () => void;
}

export function TrackerTimer({
  projectId,
  projectName,
  onClick,
}: TrackerTimerProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [localElapsedSeconds, setLocalElapsedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

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

  const toggleTimer = () => {
    if (isThisProjectRunning) {
      // Stop the current timer
      stopTimerMutation.mutate({});
    } else {
      // Start timer for this project
      startTimerMutation.mutate({
        projectId,
      });
    }
  };

  return (
    <div className="flex items-center">
      <button
        type="button"
        className={`p-1 h-6 rounded transition-all text-[#666] duration-200 ease-in-out hover:bg-accent flex items-center justify-center overflow-hidden ${
          isThisProjectRunning
            ? "w-6 mr-1 opacity-100 scale-100"
            : "w-0 mr-0 opacity-0 scale-75 group-hover:w-6 group-hover:mr-1 group-hover:opacity-100 group-hover:scale-100"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          toggleTimer();
        }}
      >
        {isThisProjectRunning ? (
          <Icons.StopOutline size={18} />
        ) : (
          <Icons.PlayOutline size={18} />
        )}
      </button>

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
