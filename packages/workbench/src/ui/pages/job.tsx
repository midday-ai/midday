import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  CopyPlus,
  Download,
  ExternalLink,
  FastForward,
  Hash,
  Info,
  Layers,
  Network,
  Play,
  RefreshCw,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react";
import * as React from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { JsonViewer } from "@/components/shared/json-viewer";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useJob, usePromoteJob, useRemoveJob, useRetryJob } from "@/lib/hooks";
import { cn, formatAbsoluteTime, formatDuration } from "@/lib/utils";
import type { JobSearch } from "@/router";

interface JobPageProps {
  queueName: string;
  jobId: string;
  readonly?: boolean;
  search: JobSearch;
  onSearchChange: (search: JobSearch) => void;
  onBack: () => void;
  onClone: (queueName: string, jobName: string, payload: string) => void;
}

export function JobPage({
  queueName,
  jobId,
  readonly,
  search,
  onSearchChange,
  onBack,
  onClone,
}: JobPageProps) {
  const navigate = useNavigate();
  const { data: job, isLoading, error } = useJob(queueName, jobId);
  const retryMutation = useRetryJob();
  const removeMutation = useRemoveJob();
  const promoteMutation = usePromoteJob();
  const [copied, setCopied] = React.useState(false);

  const actionLoading =
    retryMutation.isPending ||
    removeMutation.isPending ||
    promoteMutation.isPending;

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(jobId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetry = () => {
    retryMutation.mutate({ queueName, jobId });
  };

  const handleRemove = () => {
    removeMutation.mutate(
      { queueName, jobId },
      {
        onSuccess: () => onBack(),
      },
    );
  };

  const handlePromote = () => {
    promoteMutation.mutate({ queueName, jobId });
  };

  const handleExport = () => {
    if (!job) return;
    const exportData = {
      id: job.id,
      name: job.name,
      queueName,
      status: job.status,
      data: job.data,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      attemptsMade: job.attemptsMade,
      opts: job.opts,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      duration: job.duration,
      progress: job.progress,
      tags: job.tags,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `job-${job.name}-${jobId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClone = () => {
    if (!job) return;
    const payload = JSON.stringify(job.data, null, 2);
    onClone(queueName, job.name, payload);
  };

  if (isLoading && !job) {
    return (
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className=" border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-6 w-32 animate-pulse rounded bg-muted" />
              <div className="h-5 w-20 animate-pulse bg-muted" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 animate-pulse rounded bg-muted" />
              <div className="h-8 w-8 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="flex items-center gap-6 px-4 py-3">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          </div>
        </div>
        {/* Data section skeleton */}
        <div className=" border bg-card p-4">
          <div className="h-5 w-16 animate-pulse rounded bg-muted mb-3" />
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Job not found"
        description={error?.message || "This job may have been removed"}
        action={
          <Button variant="outline" onClick={onBack}>
            Go back
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header Card */}
      <div className=" border bg-card">
        {/* Title Row */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2  bg-muted px-2.5 py-1 text-sm font-medium">
              {job.name}
            </div>
            <StatusBadge status={job.status} />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export
            </Button>
            {!readonly && (
              <>
                <Button variant="outline" size="sm" onClick={handleClone}>
                  <CopyPlus className="mr-1.5 h-3.5 w-3.5" />
                  Clone
                </Button>
                {job.status === "failed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    disabled={actionLoading}
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Retry
                  </Button>
                )}
                {job.status === "delayed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePromote}
                    disabled={actionLoading}
                  >
                    <FastForward className="mr-1.5 h-3.5 w-3.5" />
                    Run Now
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemove}
                  disabled={actionLoading}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Remove
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Metadata Rows */}
        <div className="divide-y text-sm">
          <MetadataRow icon={Hash} label="Job ID" mono>
            <span className="flex items-center gap-2">
              {jobId}
              <button
                type="button"
                onClick={handleCopyId}
                className="rounded p-1 hover:bg-muted"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-status-success" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            </span>
          </MetadataRow>
          <MetadataRow icon={Layers} label="Queue">
            <button
              type="button"
              onClick={() =>
                navigate({
                  to: "/queues/$queueName",
                  params: { queueName },
                })
              }
              className="font-mono text-xs text-primary hover:underline"
            >
              {queueName}
            </button>
          </MetadataRow>
          {job.parent && (
            <MetadataRow icon={Network} label="Part of Flow">
              <button
                type="button"
                onClick={() =>
                  navigate({
                    to: "/flows/$queueName/$jobId",
                    params: {
                      queueName: job.parent!.queueName,
                      jobId: job.parent!.id,
                    },
                  })
                }
                className="flex items-center gap-1.5 text-primary hover:underline"
              >
                <span className="font-mono text-xs">{job.parent.id}</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </MetadataRow>
          )}
          <MetadataRow icon={Clock} label="Created">
            {formatAbsoluteTime(job.timestamp)}
          </MetadataRow>
          {job.processedOn && (
            <MetadataRow icon={Clock} label="Started">
              {formatAbsoluteTime(job.processedOn)}
            </MetadataRow>
          )}
          {job.finishedOn && (
            <MetadataRow icon={Clock} label="Finished">
              {formatAbsoluteTime(job.finishedOn)}
            </MetadataRow>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-6 border-t px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-mono font-medium">
              {job.duration ? formatDuration(job.duration) : "-"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Attempts</span>
            <span className="font-mono font-medium">
              {job.attemptsMade} / {job.opts.attempts || 3}
            </span>
            {job.attemptsMade > 1 && (
              <Badge
                variant="secondary"
                className="bg-amber-500/10 text-amber-600 text-[10px] px-1.5"
              >
                Retried
              </Badge>
            )}
          </div>
          {job.opts.delay && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Delay</span>
              <span className="font-mono font-medium">
                {formatDuration(job.opts.delay)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs
        value={search.tab || (job.status === "failed" ? "error" : "payload")}
        onValueChange={(tab) =>
          onSearchChange({
            ...search,
            tab: tab as JobSearch["tab"],
          })
        }
        className="flex-1"
      >
        <TabsList>
          <TabsTrigger value="payload">Payload</TabsTrigger>
          <TabsTrigger value="output">Output</TabsTrigger>
          {job.failedReason && (
            <TabsTrigger value="error" className="text-status-error">
              Error
            </TabsTrigger>
          )}
          {job.attemptsMade > 1 &&
            job.stacktrace &&
            job.stacktrace.length > 0 && (
              <TabsTrigger value="retries">
                Retries ({job.attemptsMade - 1})
              </TabsTrigger>
            )}
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="payload" className="mt-4">
          <div className=" border">
            <JsonViewer data={job.data} />
          </div>
        </TabsContent>

        <TabsContent value="output" className="mt-4">
          <div className=" border">
            {job.returnvalue ? (
              <JsonViewer data={job.returnvalue} />
            ) : (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                No output data
              </div>
            )}
          </div>
        </TabsContent>

        {job.failedReason && (
          <TabsContent
            value="error"
            className="mt-4 flex flex-col"
            style={{ maxHeight: "calc(100vh - 480px)", minHeight: "200px" }}
          >
            <ErrorDisplay
              error={job.failedReason}
              stacktrace={job.stacktrace}
              jobName={job.name}
              queueName={queueName}
            />
          </TabsContent>
        )}

        {job.attemptsMade > 1 &&
          job.stacktrace &&
          job.stacktrace.length > 0 && (
            <TabsContent value="retries" className="mt-4">
              <RetryHistory
                attemptsMade={job.attemptsMade}
                maxAttempts={job.opts.attempts || 3}
                stacktraces={job.stacktrace}
                status={job.status}
              />
            </TabsContent>
          )}

        <TabsContent value="timeline" className="mt-4">
          <Timeline job={job} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetadataRow({
  icon: Icon,
  label,
  children,
  mono,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className={cn(mono && "font-mono")}>{children}</div>
    </div>
  );
}

function ErrorDisplay({
  error,
  stacktrace,
  jobName,
  queueName,
}: {
  error: string;
  stacktrace?: string[];
  jobName?: string;
  queueName?: string;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    const text = stacktrace ? `${error}\n\n${stacktrace.join("\n")}` : error;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInCursor = () => {
    const errorText = stacktrace
      ? `${error}\n\n${stacktrace.join("\n")}`
      : error;
    const prompt = `Debug this error from job "${jobName || "unknown"}" in queue "${queueName || "unknown"}":\n\n${errorText}\n\nHelp me understand what caused this error and how to fix it.`;
    const deeplink = `https://cursor.com/link/prompt?text=${encodeURIComponent(prompt)}`;
    window.open(deeplink, "_blank");
  };

  return (
    <div className="flex flex-col h-full overflow-hidden border border-status-error/30 bg-status-error/5">
      <div className="flex items-center justify-between border-b border-status-error/30 px-4 py-2 shrink-0">
        <span className="font-medium text-status-error">{error}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenInCursor}
            className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-status-error/10 hover:text-foreground"
            title="Fix in Cursor"
          >
            {/* Cursor logo */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              fillRule="evenodd"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <path d="M22.106 5.68L12.5.135a.998.998 0 00-.998 0L1.893 5.68a.84.84 0 00-.419.726v11.186c0 .3.16.577.42.727l9.607 5.547a.999.999 0 00.998 0l9.608-5.547a.84.84 0 00.42-.727V6.407a.84.84 0 00-.42-.726zm-.603 1.176L12.228 22.92c-.063.108-.228.064-.228-.061V12.34a.59.59 0 00-.295-.51l-9.11-5.26c-.107-.062-.063-.228.062-.228h18.55c.264 0 .428.286.296.514z" />
            </svg>
            <span>Fix in Cursor</span>
          </button>
          <div className="h-4 w-px bg-border" />
          <button
            type="button"
            onClick={handleCopy}
            className="rounded p-1.5 hover:bg-status-error/10"
            title="Copy error"
          >
            {copied ? (
              <Check className="h-4 w-4 text-status-success" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {stacktrace && stacktrace.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="rounded p-1.5 hover:bg-status-error/10"
              title={expanded ? "Collapse" : "Expand"}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  expanded && "rotate-180",
                )}
              />
            </button>
          )}
        </div>
      </div>
      {expanded && stacktrace && stacktrace.length > 0 && (
        <div className="flex-1 overflow-auto p-4 min-h-0">
          <pre className="font-mono text-xs text-muted-foreground">
            {stacktrace.join("\n")}
          </pre>
        </div>
      )}
    </div>
  );
}

interface TimelineProps {
  job: import("../../core/types").JobInfo;
}

interface Span {
  id: string;
  label: string;
  icon: React.ElementType;
  iconColor?: string;
  startTime: number;
  endTime?: number;
  status: "success" | "error" | "running" | "waiting";
  children?: Span[];
  isLog?: boolean;
  badge?: string;
}

function Timeline({ job }: TimelineProps) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({
    root: true,
    attempt: true,
  });

  // Build span tree from job data
  const { spans, timeRange } = React.useMemo(() => {
    const startTime = job.timestamp;
    const endTime = job.finishedOn || job.processedOn || Date.now();
    const totalDuration = endTime - startTime;

    // Root job span
    const rootSpan: Span = {
      id: "root",
      label: job.name,
      icon:
        job.status === "completed"
          ? CheckCircle2
          : job.status === "failed"
            ? XCircle
            : Play,
      iconColor:
        job.status === "completed"
          ? "text-status-success"
          : job.status === "failed"
            ? "text-status-error"
            : "text-status-warning",
      startTime: job.timestamp,
      endTime: job.finishedOn,
      status:
        job.status === "completed"
          ? "success"
          : job.status === "failed"
            ? "error"
            : "running",
      badge: job.attemptsMade > 0 ? `Attempt ${job.attemptsMade}` : undefined,
      children: [],
    };

    // Add queue wait span if there was waiting time
    if (job.processedOn && job.processedOn > job.timestamp) {
      const waitDuration = job.processedOn - job.timestamp;
      if (waitDuration > 100) {
        // Only show if > 100ms
        rootSpan.children?.push({
          id: "wait",
          label: "Queued",
          icon: Clock,
          iconColor: "text-muted-foreground",
          startTime: job.timestamp,
          endTime: job.processedOn,
          status: "waiting",
        });
      }
    }

    // Add execution span
    if (job.processedOn) {
      const execSpan: Span = {
        id: "exec",
        label: "run()",
        icon: Play,
        iconColor: "text-blue-500",
        startTime: job.processedOn,
        endTime: job.finishedOn,
        status:
          job.status === "completed"
            ? "success"
            : job.status === "failed"
              ? "error"
              : "running",
        badge: job.duration ? formatDuration(job.duration) : undefined,
        children: [],
      };

      // Add progress entries as logs if progress is an object with entries
      if (job.progress && typeof job.progress === "object") {
        const progress = job.progress as Record<string, unknown>;
        if (Array.isArray(progress.logs)) {
          for (const log of progress.logs as Array<{
            message: string;
            time?: number;
          }>) {
            execSpan.children?.push({
              id: `log-${execSpan.children.length}`,
              label: log.message,
              icon: Info,
              iconColor: "text-blue-400",
              startTime: log.time || job.processedOn,
              status: "success",
              isLog: true,
            });
          }
        }
      }

      // Add error as final log if failed
      if (job.status === "failed" && job.failedReason) {
        execSpan.children?.push({
          id: "error",
          label: job.failedReason,
          icon: AlertCircle,
          iconColor: "text-status-error",
          startTime: job.finishedOn || job.processedOn,
          status: "error",
          isLog: true,
        });
      }

      rootSpan.children?.push(execSpan);
    }

    return {
      spans: [rootSpan],
      timeRange: { start: startTime, end: endTime, duration: totalDuration },
    };
  }, [job]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Generate time axis labels
  const timeLabels = React.useMemo(() => {
    const { start, end, duration } = timeRange;
    const labels: { position: number; label: string }[] = [];
    const steps = 5;

    for (let i = 0; i <= steps; i++) {
      const timestamp = start + (duration / steps) * i;
      const relativePosition = ((timestamp - start) / duration) * 100;
      labels.push({
        position: relativePosition,
        label: formatDuration(timestamp - start),
      });
    }

    return labels;
  }, [timeRange]);

  const renderSpan = (span: Span, depth = 0): React.ReactNode => {
    const hasChildren = span.children && span.children.length > 0;
    const isExpanded = expanded[span.id] !== false;
    const Icon = span.icon;

    // Calculate bar position
    const barStart =
      ((span.startTime - timeRange.start) / timeRange.duration) * 100;
    const barEnd = span.endTime
      ? ((span.endTime - timeRange.start) / timeRange.duration) * 100
      : 100;
    const barWidth = Math.max(barEnd - barStart, 0.5);

    return (
      <React.Fragment key={span.id}>
        <div className="group flex min-h-[36px] items-center border-b border-border/50 hover:bg-muted/30">
          {/* Left side - Tree */}
          <div
            className="flex w-[45%] min-w-0 items-center gap-1 py-2 pr-4"
            style={{ paddingLeft: `${depth * 20 + 12}px` }}
          >
            {/* Expand/collapse or spacer */}
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(span.id)}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-muted"
              >
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform",
                    isExpanded && "rotate-90",
                  )}
                />
              </button>
            ) : (
              <div className="w-5 shrink-0" />
            )}

            {/* Icon */}
            <Icon className={cn("h-4 w-4 shrink-0", span.iconColor)} />

            {/* Label */}
            <span
              className={cn(
                "truncate text-sm",
                span.isLog ? "text-muted-foreground" : "font-medium",
              )}
            >
              {span.label}
            </span>

            {/* Badge */}
            {span.badge && (
              <span className="ml-2 shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {span.badge}
              </span>
            )}
          </div>

          {/* Right side - Waterfall */}
          <div className="relative h-full flex-1 py-2 pr-4">
            {span.isLog ? (
              // Log entries show as dots
              <div
                className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-muted-foreground/40"
                style={{ left: `${barStart}%` }}
              />
            ) : (
              // Spans show as bars
              <div
                className={cn(
                  "absolute top-1/2 h-5 -translate-y-1/2 ",
                  span.status === "success" && "bg-status-success",
                  span.status === "error" && "bg-status-error",
                  span.status === "running" && "bg-status-warning",
                  span.status === "waiting" && "bg-muted-foreground/30",
                )}
                style={{
                  left: `${barStart}%`,
                  width: `${barWidth}%`,
                  minWidth: "2px",
                }}
              >
                {/* Duration label inside bar if wide enough */}
                {barWidth > 8 && span.endTime && (
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white">
                    {formatDuration(span.endTime - span.startTime)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Children */}
        {hasChildren &&
          isExpanded &&
          span.children?.map((child) => renderSpan(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="flex flex-col border bg-card overflow-hidden h-full">
      {/* Header with time axis */}
      <div className="flex border-b bg-muted/30 shrink-0">
        <div
          className="w-[45%] shrink-0 flex items-center py-2 pr-4"
          style={{ paddingLeft: "12px" }}
        >
          <span className="text-xs font-medium text-muted-foreground">
            Span
          </span>
        </div>
        <div className="relative flex-1 py-2 pr-4 flex items-center">
          {timeLabels.map((label, i) => (
            <span
              key={i.toString()}
              className="absolute font-mono text-[10px] text-muted-foreground"
              style={{
                left: `${label.position}%`,
                transform: "translateX(-50%)",
              }}
            >
              {label.label}
            </span>
          ))}
        </div>
      </div>

      {/* Spans */}
      <div className="flex-1 overflow-auto min-h-0">
        {spans.map((span) => renderSpan(span))}
      </div>
    </div>
  );
}

// Retry History component
interface RetryHistoryProps {
  attemptsMade: number;
  maxAttempts: number;
  stacktraces: string[];
  status: string;
}

function RetryHistory({
  attemptsMade,
  maxAttempts,
  stacktraces,
  status,
}: RetryHistoryProps) {
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4  border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-amber-500" />
          <span className="font-medium">Retry History</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {attemptsMade} of {maxAttempts} attempts
        </div>
        <Badge
          variant={status === "completed" ? "default" : "destructive"}
          className="ml-auto"
        >
          {status === "completed"
            ? "Eventually succeeded"
            : "All attempts failed"}
        </Badge>
      </div>

      {/* Attempt list */}
      <div className="space-y-3">
        {stacktraces.map((trace, index) => (
          <RetryAttemptCard
            key={index.toString()}
            attemptNumber={index + 1}
            isLast={index === stacktraces.length - 1}
            stacktrace={trace}
            succeeded={
              status === "completed" && index === stacktraces.length - 1
            }
          />
        ))}
      </div>
    </div>
  );
}

interface RetryAttemptCardProps {
  attemptNumber: number;
  isLast: boolean;
  stacktrace: string;
  succeeded: boolean;
}

function RetryAttemptCard({
  attemptNumber,
  isLast,
  stacktrace,
  succeeded,
}: RetryAttemptCardProps) {
  const [expanded, setExpanded] = React.useState(isLast);

  // Parse error message from stacktrace (first line usually)
  const errorMessage = stacktrace.split("\n")[0] || "Unknown error";

  return (
    <div
      className={cn(
        "overflow-hidden  border",
        succeeded
          ? "border-status-success/30 bg-status-success/5"
          : "border-status-error/30 bg-status-error/5",
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left"
      >
        <div
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
            succeeded
              ? "bg-status-success/20 text-status-success"
              : "bg-status-error/20 text-status-error",
          )}
        >
          {attemptNumber}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Attempt {attemptNumber}</span>
            {succeeded ? (
              <Badge
                variant="secondary"
                className="bg-status-success/10 text-status-success text-[10px]"
              >
                Success
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-status-error/10 text-status-error text-[10px]"
              >
                Failed
              </Badge>
            )}
          </div>
          {!succeeded && (
            <div className="truncate text-xs text-muted-foreground">
              {errorMessage}
            </div>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && !succeeded && (
        <div className="border-t border-inherit px-4 py-3">
          <pre className="max-h-48 overflow-auto font-mono text-xs text-muted-foreground whitespace-pre-wrap">
            {stacktrace}
          </pre>
        </div>
      )}

      {expanded && succeeded && (
        <div className="border-t border-inherit px-4 py-3 text-sm text-status-success">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Job completed successfully on this attempt
          </div>
        </div>
      )}
    </div>
  );
}
