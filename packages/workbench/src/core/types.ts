import type { Queue, RedisOptions } from "bullmq";

/**
 * Job status types matching BullMQ states
 */
export type JobStatus =
  | "waiting"
  | "active"
  | "completed"
  | "failed"
  | "delayed"
  | "paused"
  | "unknown";

/**
 * Configuration options for Workbench
 */
export interface WorkbenchOptions {
  /** BullMQ Queue instances to display */
  queues?: Queue[];
  /** Redis connection for auto-discovery of queues */
  redis?: string | RedisOptions;
  /** Basic auth credentials */
  auth?: {
    username: string;
    password: string;
  };
  /** Dashboard title */
  title?: string;
  /** Logo URL */
  logo?: string;
  /** Override base path detection */
  basePath?: string;
  /** Disable actions (retry, remove, promote) */
  readonly?: boolean;
  /** Fields from job.data to extract as filterable tags (e.g., ['teamId', 'userId']) */
  tags?: string[];
}

/**
 * Queue information for API responses
 */
export interface QueueInfo {
  name: string;
  counts: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  };
  isPaused: boolean;
}

/**
 * Worker information from BullMQ
 */
export interface WorkerInfo {
  id: string;
  name: string;
  addr: string;
  age: number; // milliseconds since worker started
  idle: number; // milliseconds since last job
  started: number; // timestamp when started
  queueName: string;
}

/**
 * Extracted tag key-value pairs from job data
 */
export type JobTags = Record<string, string | number | boolean | null>;

/**
 * Job information for API responses
 */
export interface JobInfo {
  id: string;
  name: string;
  data: unknown;
  opts: {
    attempts?: number;
    delay?: number;
    priority?: number;
  };
  progress: number | object;
  attemptsMade: number;
  processedOn?: number;
  finishedOn?: number;
  timestamp: number;
  failedReason?: string;
  stacktrace?: string[];
  returnvalue?: unknown;
  status: JobStatus;
  duration?: number;
  /** Extracted tag values from job.data based on configured tag fields */
  tags?: JobTags;
  /** Parent job info if this job is part of a flow */
  parent?: {
    id: string;
    queueName: string;
  };
}

/**
 * Overview stats for dashboard
 */
export interface OverviewStats {
  totalJobs: number;
  activeJobs: number;
  failedJobs: number;
  completedToday: number;
  avgDuration: number;
  queues: QueueInfo[];
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  cursor?: string;
  hasMore: boolean;
}

/**
 * Search result item
 */
export interface SearchResult {
  queue: string;
  job: JobInfo;
}

/**
 * Run item - job execution with queue context
 */
export interface RunInfo extends JobInfo {
  queueName: string;
}

/**
 * Lightweight run info for list view - only fields needed for table display
 * Excludes large fields like full job.data, opts, progress, etc.
 */
export interface RunInfoList {
  id: string;
  name: string;
  status: JobStatus;
  queueName: string;
  tags?: JobTags;
  processedOn?: number;
  timestamp: number;
  duration?: number;
}

/**
 * Scheduler info for repeatable jobs
 */
export interface SchedulerInfo {
  key: string;
  name: string;
  queueName: string;
  pattern?: string;
  every?: number;
  next?: number;
  endDate?: number;
  tz?: string;
}

/**
 * Delayed job info
 */
export interface DelayedJobInfo {
  id: string;
  name: string;
  queueName: string;
  delay: number;
  processAt: number;
  data: unknown;
}

/**
 * Test job request
 */
export interface TestJobRequest {
  queueName: string;
  jobName: string;
  data: unknown;
  opts?: {
    delay?: number;
    priority?: number;
    attempts?: number;
  };
}

/**
 * Sort direction
 */
export type SortDirection = "asc" | "desc";

/**
 * Sort options for API requests
 */
export interface SortOptions {
  field: string;
  direction: SortDirection;
}

/**
 * Valid sort fields for runs/jobs
 */
export type RunSortField =
  | "timestamp"
  | "name"
  | "status"
  | "duration"
  | "queueName";

/**
 * Valid sort fields for repeatable schedulers
 */
export type RepeatableSortField =
  | "name"
  | "queueName"
  | "pattern"
  | "next"
  | "tz";

/**
 * Valid sort fields for delayed schedulers
 */
export type DelayedSortField = "name" | "queueName" | "processAt" | "delay";

// ─────────────────────────────────────────────────────────────────────────────
// Metrics Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hourly bucket for metrics aggregation
 */
export interface HourlyBucket {
  /** Unix timestamp (start of hour) */
  hour: number;
  /** Number of completed jobs */
  completed: number;
  /** Number of failed jobs */
  failed: number;
  /** Average processing duration in ms */
  avgDuration: number;
  /** Average queue wait time in ms */
  avgWaitTime: number;
}

/**
 * Metrics for a single queue
 */
export interface QueueMetrics {
  queueName: string;
  buckets: HourlyBucket[];
  summary: {
    totalCompleted: number;
    totalFailed: number;
    /** Error rate as 0-1 */
    errorRate: number;
    /** Average processing duration in ms */
    avgDuration: number;
    /** Average queue wait time in ms */
    avgWaitTime: number;
    /** Average throughput per hour */
    throughputPerHour: number;
  };
}

/**
 * Slowest job entry
 */
export interface SlowestJob {
  name: string;
  queueName: string;
  duration: number;
  jobId: string;
}

/**
 * Most failing job type entry
 */
export interface FailingJobType {
  name: string;
  queueName: string;
  failCount: number;
  totalCount: number;
  errorRate: number;
}

/**
 * Complete metrics response
 */
export interface MetricsResponse {
  /** Metrics per queue */
  queues: QueueMetrics[];
  /** Aggregated metrics across all queues */
  aggregate: Omit<QueueMetrics, "queueName"> & { queueName: "all" };
  /** Top 10 slowest jobs */
  slowestJobs: SlowestJob[];
  /** Top 10 most failing job types */
  mostFailingTypes: FailingJobType[];
  /** Timestamp when metrics were computed */
  computedAt: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Flow Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A node in a flow tree representing a job and its children
 */
export interface FlowNode {
  job: JobInfo;
  queueName: string;
  children?: FlowNode[];
}

/**
 * Flow summary for list view
 */
export interface FlowSummary {
  /** Root job ID */
  id: string;
  /** Root job name */
  name: string;
  /** Queue containing root job */
  queueName: string;
  /** Root job status */
  status: JobStatus;
  /** Total number of jobs in flow */
  totalJobs: number;
  /** Number of completed jobs */
  completedJobs: number;
  /** Number of failed jobs */
  failedJobs: number;
  /** When flow was created */
  timestamp: number;
  /** Duration if completed */
  duration?: number;
}

/**
 * Request to create a test flow
 */
export interface CreateFlowRequest {
  name: string;
  queueName: string;
  data?: unknown;
  children: CreateFlowChildRequest[];
}

/**
 * Child job in a flow creation request
 */
export interface CreateFlowChildRequest {
  name: string;
  queueName: string;
  data?: unknown;
  children?: CreateFlowChildRequest[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity Timeline Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Activity bucket for timeline
 */
export interface ActivityBucket {
  /** Unix timestamp (start of bucket) */
  time: number;
  /** Number of completed jobs */
  completed: number;
  /** Number of failed jobs */
  failed: number;
}

/**
 * Activity stats response for the 7-day timeline
 */
export interface ActivityStatsResponse {
  /** Activity buckets (4-hour intervals over 7 days) */
  buckets: ActivityBucket[];
  /** Start time of the first bucket */
  startTime: number;
  /** End time (now) */
  endTime: number;
  /** Size of each bucket in ms */
  bucketSize: number;
  /** Total completed in period */
  totalCompleted: number;
  /** Total failed in period */
  totalFailed: number;
  /** Timestamp when stats were computed */
  computedAt: number;
}
