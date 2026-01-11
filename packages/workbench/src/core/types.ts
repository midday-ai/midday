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
export type RunSortField = "timestamp" | "name" | "status" | "duration" | "queueName";

/**
 * Valid sort fields for repeatable schedulers
 */
export type RepeatableSortField = "name" | "queueName" | "pattern" | "next" | "tz";

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
