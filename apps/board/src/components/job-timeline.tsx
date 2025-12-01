"use client";

import { format } from "date-fns";

interface JobTimelineProps {
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  attemptsMade: number;
}

export function JobTimeline({
  timestamp,
  processedOn,
  finishedOn,
  attemptsMade,
}: JobTimelineProps) {
  const created = new Date(timestamp);
  const processed = processedOn ? new Date(processedOn) : null;
  const finished = finishedOn ? new Date(finishedOn) : null;

  const waitTime = processed ? processed.getTime() - created.getTime() : null;
  const processTime =
    processed && finished ? finished.getTime() - processed.getTime() : null;
  const totalTime = finished ? finished.getTime() - created.getTime() : null;

  return (
    <div className="space-y-4">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />

        {/* Created */}
        <div className="relative flex items-start gap-4">
          <div className="relative z-10 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
            <div className="h-2 w-2 rounded-full bg-primary-foreground" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="text-sm font-medium">Created</div>
            <div className="text-xs text-muted-foreground">
              {format(created, "PPpp")}
            </div>
          </div>
        </div>

        {/* Processed */}
        {processed && (
          <div className="relative flex items-start gap-4 pt-4">
            <div className="relative z-10 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500">
              <div className="h-2 w-2 rounded-full bg-white" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-sm font-medium">Processed</div>
              <div className="text-xs text-muted-foreground">
                {format(processed, "PPpp")}
              </div>
              {waitTime !== null && (
                <div className="text-xs text-muted-foreground">
                  Waited {formatDuration(waitTime)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Finished */}
        {finished && (
          <div className="relative flex items-start gap-4 pt-4">
            <div className="relative z-10 flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
              <div className="h-2 w-2 rounded-full bg-white" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-sm font-medium">Finished</div>
              <div className="text-xs text-muted-foreground">
                {format(finished, "PPpp")}
              </div>
              {processTime !== null && (
                <div className="text-xs text-muted-foreground">
                  Processed in {formatDuration(processTime)}
                </div>
              )}
              {totalTime !== null && (
                <div className="text-xs text-muted-foreground">
                  Total duration: {formatDuration(totalTime)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attempts */}
        {attemptsMade > 0 && (
          <div className="relative flex items-start gap-4 pt-4">
            <div className="relative z-10 flex h-4 w-4 items-center justify-center rounded-full bg-muted">
              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-sm font-medium">Attempts</div>
              <div className="text-xs text-muted-foreground">
                {attemptsMade} attempt{attemptsMade !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}
