"use client";

import { useJobParams } from "@/hooks/use-job-params";
import { useTRPC } from "@/lib/trpc-react";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@midday/ui/dialog";
import { Skeleton } from "@midday/ui/skeleton";
import { Textarea } from "@midday/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { JobStatus } from "./job-status";
import { JobTimeline } from "./job-timeline";
import { JsonViewer } from "./json-viewer";

export function JobDetails() {
  const { jobId, queueName, setParams } = useJobParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: job, isLoading } = useQuery({
    ...trpc.jobs.get.queryOptions({
      queueName: queueName!,
      jobId: jobId!,
    }),
    enabled: Boolean(jobId && queueName),
  });

  const retryMutation = useMutation(
    trpc.jobs.retry.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.jobs.get.queryKey({
            queueName: queueName!,
            jobId: jobId!,
          }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.jobs.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.jobs.recent.queryKey(),
        });
      },
    }),
  );

  const removeMutation = useMutation(
    trpc.jobs.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.jobs.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.jobs.recent.queryKey(),
        });
        setParams({ jobId: null, queueName: null });
      },
    }),
  );

  const copyJobMutation = useMutation(
    trpc.jobs.copyJob.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: trpc.jobs.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.jobs.recent.queryKey(),
        });
        // Navigate to the new job
        setParams({ jobId: data.id, queueName: queueName! });
      },
    }),
  );

  const editAndRetryMutation = useMutation(
    trpc.jobs.editAndRetry.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: trpc.jobs.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.jobs.recent.queryKey(),
        });
        // Navigate to the new job
        setParams({ jobId: data.id, queueName: queueName! });
      },
    }),
  );

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedData, setEditedData] = useState("");

  const actionLoading =
    retryMutation.isPending ||
    removeMutation.isPending ||
    copyJobMutation.isPending ||
    editAndRetryMutation.isPending;

  const handleEditAndRetry = () => {
    try {
      const parsedData = editedData.trim() ? JSON.parse(editedData) : undefined;
      editAndRetryMutation.mutate({
        queueName: queueName!,
        jobId: jobId!,
        data: parsedData,
      });
      setEditDialogOpen(false);
    } catch (error) {
      alert("Invalid JSON. Please check your input.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-sm">Job not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium mb-1 font-serif">Job {job.id}</h2>
          <p className="text-sm text-muted-foreground">{job.name}</p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() =>
              copyJobMutation.mutate({
                queueName: queueName!,
                jobId: jobId!,
              })
            }
            disabled={actionLoading}
            variant="outline"
            size="sm"
          >
            Copy Job
          </Button>
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                disabled={actionLoading}
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditedData(JSON.stringify(job.data, null, 2));
                }}
              >
                Edit & Retry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Job Data</DialogTitle>
                <DialogDescription>
                  Modify the job data and create a new job with the updated
                  payload.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  value={editedData}
                  onChange={(e) => setEditedData(e.target.value)}
                  className="font-mono text-sm min-h-[300px]"
                  placeholder='{"key": "value"}'
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleEditAndRetry}>Create Job</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {job.state === "failed" && (
            <Button
              type="button"
              onClick={() =>
                retryMutation.mutate({ queueName: queueName!, jobId: jobId! })
              }
              disabled={actionLoading}
              variant="default"
              size="sm"
            >
              Retry
            </Button>
          )}
          <Button
            type="button"
            onClick={() =>
              removeMutation.mutate({ queueName: queueName!, jobId: jobId! })
            }
            disabled={actionLoading}
            variant="outline"
            size="sm"
          >
            Remove
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Timeline */}
        <div>
          <div className="text-xs text-muted-foreground mb-4">Timeline</div>
          <JobTimeline
            timestamp={job.timestamp}
            processedOn={job.processedOn}
            finishedOn={job.finishedOn}
            attemptsMade={job.attemptsMade}
          />
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-xs text-muted-foreground mb-2">Status</div>
            <JobStatus
              status={
                job.state === "completed"
                  ? "completed"
                  : job.state === "failed"
                    ? "failed"
                    : job.state === "active"
                      ? "active"
                      : job.state === "waiting"
                        ? "waiting"
                        : job.state === "delayed"
                          ? "delayed"
                          : "waiting"
              }
            />
          </div>

          {job.progress !== undefined && job.progress !== null && (
            <div>
              <div className="text-xs text-muted-foreground mb-2">Progress</div>
              <div className="text-sm">
                {typeof job.progress === "number"
                  ? `${job.progress}%`
                  : JSON.stringify(job.progress)}
              </div>
            </div>
          )}
        </div>

        {job.failedReason && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">
              Failed Reason
            </div>
            <div className="text-sm font-sans bg-muted p-3 rounded border border-border break-words">
              {job.failedReason}
            </div>
          </div>
        )}

        {job.stacktrace && job.stacktrace.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">Stacktrace</div>
            <div className="text-sm font-sans bg-muted p-3 rounded border border-border whitespace-pre-wrap break-words overflow-auto max-h-[300px]">
              {job.stacktrace.join("\n")}
            </div>
          </div>
        )}

        <div>
          <div className="text-xs text-muted-foreground mb-2">Data</div>
          <JsonViewer
            data={job.data}
            className="rounded border border-border max-h-[400px]"
          />
        </div>

        {job.opts && Object.keys(job.opts).length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">Options</div>
            <JsonViewer
              data={job.opts}
              className="rounded border border-border max-h-[300px]"
            />
          </div>
        )}

        {job.returnvalue && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">
              Return Value
            </div>
            <JsonViewer
              data={job.returnvalue}
              className="rounded border border-border max-h-[400px]"
            />
          </div>
        )}
      </div>
    </div>
  );
}
