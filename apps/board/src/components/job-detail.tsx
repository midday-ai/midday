"use client";

import { trpc } from "@/lib/trpc-react";
import { Button } from "@midday/ui/button";
import { Skeleton } from "@midday/ui/skeleton";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { JobStatus } from "./job-status";
import { JsonViewer } from "./json-viewer";

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }

  return `${seconds}s`;
}

interface JobDetailProps {
  queueName: string;
  jobId: string;
}

export function JobDetail({ queueName, jobId }: JobDetailProps) {
  const router = useRouter();
  const { data: job, isLoading } = trpc.jobs.get.useQuery({
    queueName,
    jobId,
  });

  const utils = trpc.useUtils();
  const retryMutation = trpc.jobs.retry.useMutation({
    onSuccess: () => {
      // Refetch job data
      utils.jobs.get.invalidate({ queueName, jobId });
    },
  });

  const removeMutation = trpc.jobs.remove.useMutation({
    onSuccess: () => {
      router.push(`/queues/${queueName}`);
    },
  });

  const actionLoading = retryMutation.isPending || removeMutation.isPending;

  const duration = useMemo(() => {
    if (!job) return null;
    if (job.finishedOn && job.processedOn) {
      return job.finishedOn - job.processedOn;
    }
    if (job.processedOn && job.state === "active") {
      return Date.now() - job.processedOn;
    }
    return null;
  }, [job?.finishedOn, job?.processedOn, job?.state]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-48 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>

        <div className="border border-border p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i}>
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-5 w-48" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!job) {
    return <div className="text-muted-foreground p-6">Job not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-normal font-serif text-primary mb-1">
            {job.name}
          </h1>
          <p className="text-sm text-muted-foreground font-sans">{job.id}</p>
        </div>
        <div className="flex gap-2">
          {job.state === "failed" && (
            <Button
              type="button"
              onClick={() => retryMutation.mutate({ queueName, jobId })}
              disabled={actionLoading}
            >
              Retry
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => removeMutation.mutate({ queueName, jobId })}
            disabled={actionLoading}
          >
            Remove
          </Button>
        </div>
      </div>

      <div className="border border-border p-6 space-y-4">
        <div>
          <div className="text-xs text-muted-foreground mb-2">State</div>
          <div>
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
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-2">Created</div>
          <div className="text-sm">
            {format(new Date(job.timestamp), "PPpp")}
          </div>
        </div>

        {job.processedOn && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">Processed</div>
            <div className="text-sm">
              {format(new Date(job.processedOn), "PPpp")}
            </div>
          </div>
        )}

        {job.finishedOn && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">Finished</div>
            <div className="text-sm">
              {format(new Date(job.finishedOn), "PPpp")}
            </div>
          </div>
        )}

        {duration !== null && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">Duration</div>
            <div className="text-sm">{formatDuration(duration)}</div>
          </div>
        )}

        <div>
          <div className="text-xs text-muted-foreground mb-2">Attempts</div>
          <div className="text-sm">{job.attemptsMade}</div>
        </div>

        {job.progress !== undefined &&
          job.progress !== null &&
          typeof job.progress === "number" && (
            <div>
              <div className="text-xs text-muted-foreground mb-2">Progress</div>
              <div className="text-sm">{job.progress}%</div>
            </div>
          )}

        {job.failedReason && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">
              Failed Reason
            </div>
            <div className="text-sm font-sans bg-muted p-3">
              {job.failedReason}
            </div>
          </div>
        )}

        {job.stacktrace && job.stacktrace.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">Stacktrace</div>
            <div className="text-sm font-sans bg-muted p-3 whitespace-pre-wrap">
              {job.stacktrace.join("\n")}
            </div>
          </div>
        )}

        <div>
          <div className="text-xs text-muted-foreground mb-2">Data</div>
          <JsonViewer data={job.data} />
        </div>

        {job.opts && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">Options</div>
            <JsonViewer data={job.opts} />
          </div>
        )}

        {job.returnvalue && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">
              Return Value
            </div>
            <JsonViewer data={job.returnvalue} />
          </div>
        )}
      </div>
    </div>
  );
}
