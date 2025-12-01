"use client";

import { useTRPC } from "@/lib/trpc-react";
import { Button } from "@midday/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface BulkActionsProps {
  selectedJobIds: string[];
  queueName?: string;
  jobsByQueue?: Map<string, string[]>; // queueName -> jobIds[]
  onClearSelection: () => void;
}

export function BulkActions({
  selectedJobIds,
  queueName,
  jobsByQueue,
  onClearSelection,
}: BulkActionsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const retryMutation = useMutation(
    trpc.jobs.bulkRetry.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        onClearSelection();
        setIsProcessing(false);
      },
      onError: () => {
        setIsProcessing(false);
      },
    }),
  );

  const removeMutation = useMutation(
    trpc.jobs.bulkRemove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        onClearSelection();
        setIsProcessing(false);
      },
      onError: () => {
        setIsProcessing(false);
      },
    }),
  );

  const retryWithDelayMutation = useMutation(
    trpc.jobs.bulkRetryWithDelay.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        onClearSelection();
        setIsProcessing(false);
      },
      onError: () => {
        setIsProcessing(false);
      },
    }),
  );

  if (selectedJobIds.length === 0) {
    return null;
  }

  const handleBulkOperation = async (
    operation: (queueName: string, jobIds: string[]) => Promise<void>,
  ) => {
    setIsProcessing(true);
    try {
      if (queueName) {
        // Single queue operation
        await operation(queueName, selectedJobIds);
      } else if (jobsByQueue) {
        // Multiple queues - execute per queue
        await Promise.allSettled(
          Array.from(jobsByQueue.entries()).map(([qName, jobIds]) =>
            operation(qName, jobIds),
          ),
        );
      }
    } catch (error) {
      console.error("Bulk operation error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = async () => {
    await handleBulkOperation(async (qName, jobIds) => {
      await retryMutation.mutateAsync({
        jobIds,
        queueName: qName,
      });
    });
  };

  const handleRemove = async () => {
    if (
      !confirm(
        `Are you sure you want to remove ${selectedJobIds.length} job(s)?`,
      )
    ) {
      return;
    }
    await handleBulkOperation(async (qName, jobIds) => {
      await removeMutation.mutateAsync({
        jobIds,
        queueName: qName,
      });
    });
  };

  const handleRetryWithDelay = async () => {
    await handleBulkOperation(async (qName, jobIds) => {
      await retryWithDelayMutation.mutateAsync({
        jobIds,
        queueName: qName,
        delay: 5000, // 5 seconds default
      });
    });
  };

  const isLoading =
    isProcessing ||
    retryMutation.isPending ||
    removeMutation.isPending ||
    retryWithDelayMutation.isPending;

  return (
    <div className="flex items-center gap-2 p-4 bg-muted/50 border border-border rounded-md">
      <span className="text-sm text-foreground">
        {selectedJobIds.length} job{selectedJobIds.length !== 1 ? "s" : ""}{" "}
        selected
      </span>
      <div className="flex gap-2 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetry}
          disabled={isLoading}
        >
          Retry
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetryWithDelay}
          disabled={isLoading}
        >
          Retry with Delay
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRemove}
          disabled={isLoading}
        >
          Remove
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={isLoading}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
