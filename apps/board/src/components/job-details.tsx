"use client";

import { useJobParams } from "@/hooks/use-job-params";
import { trpc } from "@/lib/trpc-react";
import { Button } from "@midday/ui/button";
import { Skeleton } from "@midday/ui/skeleton";
import { format } from "date-fns";
import { JobStatus } from "./job-status";
import { JsonViewer } from "./json-viewer";

export function JobDetails() {
  console.log("JobDetails rendered");
  const { jobId, queueName, setParams } = useJobParams();
  const { data: job, isLoading } = trpc.jobs.get.useQuery(
    {
      queueName: queueName!,
      jobId: jobId!,
    },
    {
      enabled: Boolean(jobId && queueName),
    },
  );

  const utils = trpc.useUtils();
  const retryMutation = trpc.jobs.retry.useMutation({
    onSuccess: () => {
      utils.jobs.get.invalidate({ queueName: queueName!, jobId: jobId! });
      utils.jobs.list.invalidate();
      utils.jobs.recent.invalidate();
    },
  });

  const removeMutation = trpc.jobs.remove.useMutation({
    onSuccess: () => {
      utils.jobs.list.invalidate();
      utils.jobs.recent.invalidate();
      setParams({ jobId: null, queueName: null });
    },
  });

  const actionLoading = retryMutation.isPending || removeMutation.isPending;

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

          <div>
            <div className="text-xs text-muted-foreground mb-2">Created</div>
            <div className="text-sm">
              {format(new Date(job.timestamp), "PPpp")}
            </div>
          </div>

          {job.processedOn && (
            <div>
              <div className="text-xs text-muted-foreground mb-2">
                Processed
              </div>
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

          <div>
            <div className="text-xs text-muted-foreground mb-2">Attempts</div>
            <div className="text-sm">{job.attemptsMade}</div>
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
