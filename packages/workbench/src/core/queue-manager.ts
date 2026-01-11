import { FlowProducer, type Job, type Queue } from "bullmq";
import type {
  CreateFlowChildRequest,
  CreateFlowRequest,
  DelayedJobInfo,
  FailingJobType,
  FlowNode,
  FlowSummary,
  HourlyBucket,
  JobInfo,
  JobStatus,
  JobTags,
  MetricsResponse,
  OverviewStats,
  PaginatedResponse,
  QueueInfo,
  QueueMetrics,
  RunInfo,
  SchedulerInfo,
  SearchResult,
  SlowestJob,
  SortOptions,
  TestJobRequest,
} from "./types";

/**
 * Manages queue operations for the Workbench dashboard
 */
export class QueueManager {
  private queues: Map<string, Queue> = new Map();
  private tagFields: string[] = [];
  private flowProducer: FlowProducer | null = null;

  constructor(queues: Queue[], tagFields: string[] = []) {
    for (const queue of queues) {
      this.queues.set(queue.name, queue);
    }
    this.tagFields = tagFields;

    // Initialize FlowProducer using connection from first queue
    const firstQueue = queues[0];
    if (firstQueue) {
      const connection = firstQueue.opts?.connection;
      if (connection) {
        this.flowProducer = new FlowProducer({ connection });
      }
    }
  }

  /**
   * Get configured tag field names
   */
  getTagFields(): string[] {
    return this.tagFields;
  }

  /**
   * Get all queue names
   */
  getQueueNames(): string[] {
    return Array.from(this.queues.keys());
  }

  /**
   * Get a queue by name
   */
  getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  /**
   * Get information for all queues
   */
  async getQueues(): Promise<QueueInfo[]> {
    const results: QueueInfo[] = [];

    for (const [name, queue] of this.queues) {
      const counts = await queue.getJobCounts();
      const isPaused = await queue.isPaused();

      results.push({
        name,
        counts: {
          waiting: counts.waiting || 0,
          active: counts.active || 0,
          completed: counts.completed || 0,
          failed: counts.failed || 0,
          delayed: counts.delayed || 0,
          paused: counts.paused || 0,
        },
        isPaused,
      });
    }

    return results;
  }

  /**
   * Get overview statistics
   */
  async getOverview(): Promise<OverviewStats> {
    const queues = await this.getQueues();

    let totalJobs = 0;
    let activeJobs = 0;
    let failedJobs = 0;

    for (const queue of queues) {
      totalJobs +=
        queue.counts.waiting + queue.counts.active + queue.counts.delayed;
      activeJobs += queue.counts.active;
      failedJobs += queue.counts.failed;
    }

    // Get completed jobs from today (approximation based on completed count)
    const completedToday = queues.reduce(
      (sum, q) => sum + q.counts.completed,
      0,
    );

    return {
      totalJobs,
      activeJobs,
      failedJobs,
      completedToday,
      avgDuration: 0, // Would need metrics tracking
      queues,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Queue Control (Pause/Resume)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Pause a queue - stops processing new jobs
   */
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue "${queueName}" not found`);
    }
    await queue.pause();
  }

  /**
   * Resume a paused queue
   */
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue "${queueName}" not found`);
    }
    await queue.resume();
  }

  /**
   * Check if a queue is paused
   */
  async isQueuePaused(queueName: string): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue "${queueName}" not found`);
    }
    return queue.isPaused();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Metrics
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get metrics for the last 24 hours
   */
  async getMetrics(): Promise<MetricsResponse> {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    // Initialize hourly buckets for last 24 hours
    const createEmptyBuckets = (): HourlyBucket[] => {
      const buckets: HourlyBucket[] = [];
      const startHour =
        Math.floor(twentyFourHoursAgo / (60 * 60 * 1000)) * (60 * 60 * 1000);
      for (let i = 0; i < 24; i++) {
        buckets.push({
          hour: startHour + i * 60 * 60 * 1000,
          completed: 0,
          failed: 0,
          avgDuration: 0,
          avgWaitTime: 0,
        });
      }
      return buckets;
    };

    const queueMetricsMap = new Map<
      string,
      {
        buckets: HourlyBucket[];
        durations: number[][];
        waitTimes: number[][];
      }
    >();

    // Initialize per-queue metrics
    for (const queueName of this.queues.keys()) {
      queueMetricsMap.set(queueName, {
        buckets: createEmptyBuckets(),
        durations: Array.from({ length: 24 }, () => []),
        waitTimes: Array.from({ length: 24 }, () => []),
      });
    }

    // Track slowest jobs and failing job types
    const allJobs: Array<{
      name: string;
      queueName: string;
      duration: number;
      jobId: string;
    }> = [];
    const jobTypeStats = new Map<
      string,
      { name: string; queueName: string; completed: number; failed: number }
    >();

    // Fetch completed and failed jobs from each queue
    for (const [queueName, queue] of this.queues) {
      const metrics = queueMetricsMap.get(queueName)!;

      // Fetch completed jobs
      const completedJobs = await queue.getJobs(["completed"], 0, 1000);
      for (const job of completedJobs) {
        if (!job || !job.finishedOn || job.finishedOn < twentyFourHoursAgo)
          continue;

        const bucketIndex = Math.floor(
          (job.finishedOn - (metrics.buckets[0]?.hour || 0)) / (60 * 60 * 1000),
        );
        if (bucketIndex >= 0 && bucketIndex < 24) {
          metrics.buckets[bucketIndex].completed++;

          const duration = job.processedOn
            ? job.finishedOn - job.processedOn
            : 0;
          const waitTime = job.processedOn
            ? job.processedOn - job.timestamp
            : 0;

          if (duration > 0) {
            metrics.durations[bucketIndex].push(duration);
            allJobs.push({
              name: job.name,
              queueName,
              duration,
              jobId: job.id || "",
            });
          }
          if (waitTime > 0) {
            metrics.waitTimes[bucketIndex].push(waitTime);
          }
        }

        // Track job type stats
        const key = `${queueName}:${job.name}`;
        const stats = jobTypeStats.get(key) || {
          name: job.name,
          queueName,
          completed: 0,
          failed: 0,
        };
        stats.completed++;
        jobTypeStats.set(key, stats);
      }

      // Fetch failed jobs
      const failedJobs = await queue.getJobs(["failed"], 0, 1000);
      for (const job of failedJobs) {
        if (!job || !job.finishedOn || job.finishedOn < twentyFourHoursAgo)
          continue;

        const bucketIndex = Math.floor(
          (job.finishedOn - (metrics.buckets[0]?.hour || 0)) / (60 * 60 * 1000),
        );
        if (bucketIndex >= 0 && bucketIndex < 24) {
          metrics.buckets[bucketIndex].failed++;
        }

        // Track job type stats
        const key = `${queueName}:${job.name}`;
        const stats = jobTypeStats.get(key) || {
          name: job.name,
          queueName,
          completed: 0,
          failed: 0,
        };
        stats.failed++;
        jobTypeStats.set(key, stats);
      }
    }

    // Calculate averages for each bucket
    for (const metrics of queueMetricsMap.values()) {
      for (let i = 0; i < 24; i++) {
        const durations = metrics.durations[i];
        const waitTimes = metrics.waitTimes[i];
        if (durations.length > 0) {
          metrics.buckets[i].avgDuration = Math.round(
            durations.reduce((a, b) => a + b, 0) / durations.length,
          );
        }
        if (waitTimes.length > 0) {
          metrics.buckets[i].avgWaitTime = Math.round(
            waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length,
          );
        }
      }
    }

    // Build queue metrics array
    const queues: QueueMetrics[] = [];
    for (const [queueName, metrics] of queueMetricsMap) {
      const totalCompleted = metrics.buckets.reduce(
        (sum, b) => sum + b.completed,
        0,
      );
      const totalFailed = metrics.buckets.reduce((sum, b) => sum + b.failed, 0);
      const allDurations = metrics.durations.flat();
      const allWaitTimes = metrics.waitTimes.flat();

      queues.push({
        queueName,
        buckets: metrics.buckets,
        summary: {
          totalCompleted,
          totalFailed,
          errorRate:
            totalCompleted + totalFailed > 0
              ? totalFailed / (totalCompleted + totalFailed)
              : 0,
          avgDuration:
            allDurations.length > 0
              ? Math.round(
                  allDurations.reduce((a, b) => a + b, 0) / allDurations.length,
                )
              : 0,
          avgWaitTime:
            allWaitTimes.length > 0
              ? Math.round(
                  allWaitTimes.reduce((a, b) => a + b, 0) / allWaitTimes.length,
                )
              : 0,
          throughputPerHour: Math.round((totalCompleted + totalFailed) / 24),
        },
      });
    }

    // Build aggregate metrics
    const aggregateBuckets = createEmptyBuckets();
    const aggregateDurations: number[][] = Array.from({ length: 24 }, () => []);
    const aggregateWaitTimes: number[][] = Array.from({ length: 24 }, () => []);

    for (const metrics of queueMetricsMap.values()) {
      for (let i = 0; i < 24; i++) {
        aggregateBuckets[i].completed += metrics.buckets[i].completed;
        aggregateBuckets[i].failed += metrics.buckets[i].failed;
        aggregateDurations[i].push(...metrics.durations[i]);
        aggregateWaitTimes[i].push(...metrics.waitTimes[i]);
      }
    }

    // Calculate aggregate averages
    for (let i = 0; i < 24; i++) {
      if (aggregateDurations[i].length > 0) {
        aggregateBuckets[i].avgDuration = Math.round(
          aggregateDurations[i].reduce((a, b) => a + b, 0) /
            aggregateDurations[i].length,
        );
      }
      if (aggregateWaitTimes[i].length > 0) {
        aggregateBuckets[i].avgWaitTime = Math.round(
          aggregateWaitTimes[i].reduce((a, b) => a + b, 0) /
            aggregateWaitTimes[i].length,
        );
      }
    }

    const totalCompleted = aggregateBuckets.reduce(
      (sum, b) => sum + b.completed,
      0,
    );
    const totalFailed = aggregateBuckets.reduce((sum, b) => sum + b.failed, 0);
    const allDurations = aggregateDurations.flat();
    const allWaitTimes = aggregateWaitTimes.flat();

    // Get top 10 slowest jobs
    const slowestJobs = allJobs
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    // Get top 10 most failing job types
    const mostFailingTypes = Array.from(jobTypeStats.values())
      .filter((s) => s.failed > 0)
      .map((s) => ({
        name: s.name,
        queueName: s.queueName,
        failCount: s.failed,
        totalCount: s.completed + s.failed,
        errorRate: s.failed / (s.completed + s.failed),
      }))
      .sort((a, b) => b.failCount - a.failCount)
      .slice(0, 10);

    return {
      queues,
      aggregate: {
        queueName: "all",
        buckets: aggregateBuckets,
        summary: {
          totalCompleted,
          totalFailed,
          errorRate:
            totalCompleted + totalFailed > 0
              ? totalFailed / (totalCompleted + totalFailed)
              : 0,
          avgDuration:
            allDurations.length > 0
              ? Math.round(
                  allDurations.reduce((a, b) => a + b, 0) / allDurations.length,
                )
              : 0,
          avgWaitTime:
            allWaitTimes.length > 0
              ? Math.round(
                  allWaitTimes.reduce((a, b) => a + b, 0) / allWaitTimes.length,
                )
              : 0,
          throughputPerHour: Math.round((totalCompleted + totalFailed) / 24),
        },
      },
      slowestJobs,
      mostFailingTypes,
      computedAt: now,
    };
  }

  /**
   * Get jobs for a specific queue with pagination and sorting
   */
  async getJobs(
    queueName: string,
    status?: JobStatus,
    limit = 50,
    start = 0,
    sort?: SortOptions,
  ): Promise<PaginatedResponse<JobInfo>> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return { data: [], total: 0, hasMore: false };
    }

    const types = status
      ? [status]
      : ["waiting", "active", "completed", "failed", "delayed"];

    const jobs: Job[] = [];
    let total = 0;

    for (const type of types) {
      const typeJobs = await queue.getJobs(type as any, start, start + limit);
      jobs.push(...typeJobs);

      const counts = await queue.getJobCounts(type as any);
      total += counts[type as keyof typeof counts] || 0;
    }

    // Convert to JobInfo first for sorting on computed fields
    const jobInfos = await Promise.all(jobs.map((job) => this.jobToInfo(job)));

    // Apply sorting
    const sortField = sort?.field ?? "timestamp";
    const sortDir = sort?.direction === "asc" ? 1 : -1;

    jobInfos.sort((a, b) => {
      const aVal = this.getSortValue(a, sortField);
      const bVal = this.getSortValue(b, sortField);
      if (aVal < bVal) return -1 * sortDir;
      if (aVal > bVal) return 1 * sortDir;
      return 0;
    });

    // Take only the requested limit
    const data = jobInfos.slice(0, limit);

    return {
      data,
      total,
      hasMore: start + limit < total,
      cursor: start + limit < total ? String(start + limit) : undefined,
    };
  }

  /**
   * Get a single job by ID
   */
  async getJob(queueName: string, jobId: string): Promise<JobInfo | null> {
    const queue = this.queues.get(queueName);
    if (!queue) return null;

    const job = await queue.getJob(jobId);
    if (!job) return null;

    return this.jobToInfo(job);
  }

  /**
   * Retry a failed job
   */
  async retryJob(queueName: string, jobId: string): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue) return false;

    const job = await queue.getJob(jobId);
    if (!job) return false;

    await job.retry();
    return true;
  }

  /**
   * Remove a job
   */
  async removeJob(queueName: string, jobId: string): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue) return false;

    const job = await queue.getJob(jobId);
    if (!job) return false;

    await job.remove();
    return true;
  }

  /**
   * Promote a delayed job to waiting
   */
  async promoteJob(queueName: string, jobId: string): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue) return false;

    const job = await queue.getJob(jobId);
    if (!job) return false;

    await job.promote();
    return true;
  }

  /**
   * Parse search query for field:value filters
   * Returns { filters: { field: value }, text: remainingText }
   */
  private parseSearchQuery(query: string): {
    filters: Record<string, string>;
    text: string;
  } {
    const filters: Record<string, string> = {};
    const parts: string[] = [];

    // Match field:value patterns (supporting quoted values)
    const regex = /(\w+):(?:"([^"]+)"|(\S+))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while (true) {
      match = regex.exec(query);
      if (!match) break;
      // Add any text before this match
      if (match.index > lastIndex) {
        parts.push(query.slice(lastIndex, match.index).trim());
      }
      const field = match[1];
      const value = match[2] || match[3]; // quoted or unquoted value
      filters[field] = value;
      lastIndex = regex.lastIndex;
    }

    // Add remaining text after last match
    if (lastIndex < query.length) {
      parts.push(query.slice(lastIndex).trim());
    }

    return {
      filters,
      text: parts.filter(Boolean).join(" "),
    };
  }

  /**
   * Check if a job matches the given tag filters
   */
  private jobMatchesFilters(
    job: Job,
    filters: Record<string, string>,
  ): boolean {
    if (!job.data || typeof job.data !== "object") {
      return Object.keys(filters).length === 0;
    }

    const dataObj = job.data as Record<string, unknown>;
    for (const [field, value] of Object.entries(filters)) {
      const jobValue = dataObj[field];
      if (jobValue === undefined || jobValue === null) {
        return false;
      }
      // Case-insensitive comparison for strings
      const strJobValue = String(jobValue).toLowerCase();
      const strFilterValue = value.toLowerCase();
      if (!strJobValue.includes(strFilterValue)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Search jobs across all queues
   * Supports field:value syntax (e.g., "teamId:abc-123 invoice")
   */
  async search(query: string, limit = 20): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const { filters, text } = this.parseSearchQuery(query);
    const lowerText = text.toLowerCase();
    const hasFilters = Object.keys(filters).length > 0;
    const hasText = lowerText.length > 0;

    for (const [queueName, queue] of this.queues) {
      // Search in all job states
      const types = ["waiting", "active", "completed", "failed", "delayed"];

      for (const type of types) {
        const jobs = await queue.getJobs(type as any, 0, 100);

        for (const job of jobs) {
          // Check field:value filters first
          if (hasFilters && !this.jobMatchesFilters(job, filters)) {
            continue;
          }

          // If there's text search, match by job ID, name, or data
          if (hasText) {
            const matchesId = job.id?.toLowerCase().includes(lowerText);
            const matchesName = job.name?.toLowerCase().includes(lowerText);
            const matchesData = JSON.stringify(job.data)
              .toLowerCase()
              .includes(lowerText);

            if (!matchesId && !matchesName && !matchesData) {
              continue;
            }
          }

          // If no text and no filters, this would match everything - skip
          if (!hasFilters && !hasText) {
            continue;
          }

          results.push({
            queue: queueName,
            job: await this.jobToInfo(job),
          });

          if (results.length >= limit) {
            return results;
          }
        }
      }
    }

    return results;
  }

  /**
   * Clean jobs from a queue
   */
  async cleanJobs(
    queueName: string,
    status: "completed" | "failed",
    grace = 0,
  ): Promise<number> {
    const queue = this.queues.get(queueName);
    if (!queue) return 0;

    const removed = await queue.clean(grace, 1000, status);
    return removed.length;
  }

  /**
   * Get all runs (jobs) across all queues with sorting
   */
  async getAllRuns(
    limit = 50,
    start = 0,
    sort?: SortOptions,
  ): Promise<PaginatedResponse<RunInfo>> {
    const allJobs: { job: Job; queueName: string }[] = [];

    // First, get accurate total count from all queues
    let total = 0;
    for (const [, queue] of this.queues) {
      const counts = await queue.getJobCounts();
      total +=
        (counts.waiting || 0) +
        (counts.active || 0) +
        (counts.completed || 0) +
        (counts.failed || 0) +
        (counts.delayed || 0);
    }

    // Fetch jobs for pagination - get more than limit to ensure we have enough after sorting
    const fetchLimit = Math.min(start + limit + 100, 1000);
    for (const [queueName, queue] of this.queues) {
      const types = ["waiting", "active", "completed", "failed", "delayed"];
      for (const type of types) {
        const jobs = await queue.getJobs(type as any, 0, fetchLimit);
        for (const job of jobs) {
          allJobs.push({ job, queueName });
        }
      }
    }

    // Convert to RunInfo for sorting on computed fields
    const runInfos = await Promise.all(
      allJobs.map(async ({ job, queueName }) => {
        const info = await this.jobToInfo(job);
        return { ...info, queueName } as RunInfo;
      }),
    );

    // Apply sorting
    const sortField = sort?.field ?? "timestamp";
    const sortDir = sort?.direction === "asc" ? 1 : -1;

    runInfos.sort((a, b) => {
      const aVal = this.getSortValue(a, sortField);
      const bVal = this.getSortValue(b, sortField);
      if (aVal < bVal) return -1 * sortDir;
      if (aVal > bVal) return 1 * sortDir;
      return 0;
    });

    const data = runInfos.slice(start, start + limit);

    return {
      data,
      total,
      hasMore: start + limit < total,
      cursor: start + limit < total ? String(start + limit) : undefined,
    };
  }

  /**
   * Get all schedulers (repeatable and delayed jobs) with sorting
   */
  async getSchedulers(
    repeatableSort?: SortOptions,
    delayedSort?: SortOptions,
  ): Promise<{
    repeatable: SchedulerInfo[];
    delayed: DelayedJobInfo[];
  }> {
    const repeatable: SchedulerInfo[] = [];
    const delayed: DelayedJobInfo[] = [];

    for (const [queueName, queue] of this.queues) {
      // Get repeatable jobs
      const repeatableJobs = await queue.getRepeatableJobs();
      for (const job of repeatableJobs) {
        repeatable.push({
          key: job.key,
          name: job.name || "unnamed",
          queueName,
          pattern: job.pattern ?? undefined,
          every: job.every ? Number(job.every) : undefined,
          next: job.next ?? undefined,
          endDate: job.endDate ?? undefined,
          tz: job.tz ?? undefined,
        });
      }

      // Get delayed jobs
      const delayedJobs = await queue.getJobs("delayed", 0, 100);
      for (const job of delayedJobs) {
        const delay = job.opts.delay || 0;
        delayed.push({
          id: job.id || "",
          name: job.name,
          queueName,
          delay,
          processAt: job.timestamp + delay,
          data: job.data,
        });
      }
    }

    // Sort repeatable jobs
    const repeatableField = repeatableSort?.field ?? "name";
    const repeatableDir = repeatableSort?.direction === "desc" ? -1 : 1;
    repeatable.sort((a, b) => {
      const aVal = this.getSchedulerSortValue(a, repeatableField);
      const bVal = this.getSchedulerSortValue(b, repeatableField);
      if (aVal < bVal) return -1 * repeatableDir;
      if (aVal > bVal) return 1 * repeatableDir;
      return 0;
    });

    // Sort delayed jobs
    const delayedField = delayedSort?.field ?? "processAt";
    const delayedDir = delayedSort?.direction === "desc" ? -1 : 1;
    delayed.sort((a, b) => {
      const aVal = this.getDelayedSortValue(a, delayedField);
      const bVal = this.getDelayedSortValue(b, delayedField);
      if (aVal < bVal) return -1 * delayedDir;
      if (aVal > bVal) return 1 * delayedDir;
      return 0;
    });

    return { repeatable, delayed };
  }

  /**
   * Enqueue a new job (for testing)
   */
  async enqueueJob(request: TestJobRequest): Promise<{ id: string }> {
    const queue = this.queues.get(request.queueName);
    if (!queue) {
      throw new Error(`Queue "${request.queueName}" not found`);
    }

    const job = await queue.add(request.jobName, request.data, {
      delay: request.opts?.delay,
      priority: request.opts?.priority,
      attempts: request.opts?.attempts,
    });

    return { id: job.id || "" };
  }

  /**
   * Extract tag values from job data based on configured tag fields
   */
  private extractTags(data: unknown): JobTags | undefined {
    if (!this.tagFields.length || !data || typeof data !== "object") {
      return undefined;
    }

    const tags: JobTags = {};
    const dataObj = data as Record<string, unknown>;

    for (const field of this.tagFields) {
      const value = dataObj[field];
      if (
        value !== undefined &&
        (typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean" ||
          value === null)
      ) {
        tags[field] = value as string | number | boolean | null;
      }
    }

    return Object.keys(tags).length > 0 ? tags : undefined;
  }

  /**
   * Get unique values for a specific tag field across all jobs
   */
  async getTagValues(
    field: string,
    limit = 50,
  ): Promise<{ value: string; count: number }[]> {
    const valueMap = new Map<string, number>();

    for (const [, queue] of this.queues) {
      const types = ["waiting", "active", "completed", "failed", "delayed"];
      for (const type of types) {
        const jobs = await queue.getJobs(type as any, 0, 500);
        for (const job of jobs) {
          if (job.data && typeof job.data === "object") {
            const dataObj = job.data as Record<string, unknown>;
            const value = dataObj[field];
            if (value !== undefined && value !== null) {
              const strValue = String(value);
              valueMap.set(strValue, (valueMap.get(strValue) || 0) + 1);
            }
          }
        }
      }
    }

    // Sort by count descending and take top N
    const sorted = Array.from(valueMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([value, count]) => ({ value, count }));

    return sorted;
  }

  /**
   * Get sortable value from JobInfo/RunInfo
   */
  private getSortValue(
    item: JobInfo | RunInfo,
    field: string,
  ): string | number {
    switch (field) {
      case "timestamp":
        return item.timestamp ?? 0;
      case "name":
        return item.name.toLowerCase();
      case "status":
        return item.status;
      case "duration":
        return item.duration ?? 0;
      case "queueName":
        return "queueName" in item ? item.queueName.toLowerCase() : "";
      case "processedOn":
        return item.processedOn ?? 0;
      default:
        return item.timestamp ?? 0;
    }
  }

  /**
   * Get sortable value from SchedulerInfo
   */
  private getSchedulerSortValue(
    item: SchedulerInfo,
    field: string,
  ): string | number {
    switch (field) {
      case "name":
        return item.name.toLowerCase();
      case "queueName":
        return item.queueName.toLowerCase();
      case "pattern":
        return item.pattern?.toLowerCase() ?? "";
      case "next":
        return item.next ?? 0;
      case "tz":
        return item.tz?.toLowerCase() ?? "";
      default:
        return item.name.toLowerCase();
    }
  }

  /**
   * Get sortable value from DelayedJobInfo
   */
  private getDelayedSortValue(
    item: DelayedJobInfo,
    field: string,
  ): string | number {
    switch (field) {
      case "name":
        return item.name.toLowerCase();
      case "queueName":
        return item.queueName.toLowerCase();
      case "processAt":
        return item.processAt;
      case "delay":
        return item.delay;
      default:
        return item.processAt;
    }
  }

  /**
   * Convert a BullMQ Job to JobInfo
   */
  private async jobToInfo(job: Job): Promise<JobInfo> {
    const state = await job.getState();
    const duration =
      job.finishedOn && job.processedOn
        ? job.finishedOn - job.processedOn
        : undefined;

    // Normalize progress to number or object
    let progress: number | object = 0;
    if (typeof job.progress === "number") {
      progress = job.progress;
    } else if (typeof job.progress === "object" && job.progress !== null) {
      progress = job.progress;
    }

    // Extract configured tag fields from job data
    const tags = this.extractTags(job.data);

    // Extract parent info if this job is part of a flow
    let parent: { id: string; queueName: string } | undefined;
    if (job.parent?.id) {
      parent = {
        id: job.parent.id,
        queueName:
          job.parent.queueKey?.split(":")[1] || job.parent.queueKey || "",
      };
    } else if (job.parentKey) {
      // parentKey format: "bull:queueName:jobId"
      const parts = job.parentKey.split(":");
      if (parts.length >= 3) {
        parent = {
          id: parts[parts.length - 1] || "",
          queueName: parts[parts.length - 2] || "",
        };
      }
    }

    return {
      id: job.id || "",
      name: job.name,
      data: job.data,
      opts: {
        attempts: job.opts.attempts,
        delay: job.opts.delay,
        priority: job.opts.priority,
      },
      progress,
      attemptsMade: job.attemptsMade,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      timestamp: job.timestamp,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      returnvalue: job.returnvalue,
      status: state as JobStatus,
      duration,
      tags,
      parent,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Bulk Operations
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Retry multiple jobs across queues
   */
  async bulkRetry(
    jobs: { queueName: string; jobId: string }[],
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const { queueName, jobId } of jobs) {
      try {
        const queue = this.queues.get(queueName);
        if (!queue) {
          failed++;
          continue;
        }

        const job = await queue.getJob(jobId);
        if (!job) {
          failed++;
          continue;
        }

        await job.retry();
        success++;
      } catch {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Delete multiple jobs across queues
   */
  async bulkDelete(
    jobs: { queueName: string; jobId: string }[],
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const { queueName, jobId } of jobs) {
      try {
        const queue = this.queues.get(queueName);
        if (!queue) {
          failed++;
          continue;
        }

        const job = await queue.getJob(jobId);
        if (!job) {
          failed++;
          continue;
        }

        await job.remove();
        success++;
      } catch {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Promote multiple delayed jobs across queues (move to waiting)
   */
  async bulkPromote(
    jobs: { queueName: string; jobId: string }[],
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const { queueName, jobId } of jobs) {
      try {
        const queue = this.queues.get(queueName);
        if (!queue) {
          failed++;
          continue;
        }

        const job = await queue.getJob(jobId);
        if (!job) {
          failed++;
          continue;
        }

        await job.promote();
        success++;
      } catch {
        failed++;
      }
    }

    return { success, failed };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Flow Operations
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get all flows (jobs that have children or are part of a flow)
   */
  async getFlows(limit = 50): Promise<FlowSummary[]> {
    if (!this.flowProducer) {
      return [];
    }

    const flows: FlowSummary[] = [];
    const seenJobIds = new Set<string>();

    // Scan all queues for jobs that are part of flows
    // Include "waiting-children" state for parent jobs waiting on children
    for (const [queueName, queue] of this.queues) {
      const types = [
        "waiting",
        "waiting-children",
        "active",
        "completed",
        "failed",
        "delayed",
      ];

      for (const type of types) {
        try {
          const jobs = await queue.getJobs(type as any, 0, 200);

          for (const job of jobs) {
            if (!job || !job.id) continue;

            // Skip if we've already seen this job
            const jobKey = `${queueName}:${job.id}`;
            if (seenJobIds.has(jobKey)) continue;
            seenJobIds.add(jobKey);

            // Check if this is a root job (has no parent)
            const hasParent = !!job.parent || !!job.parentKey;
            if (hasParent) continue; // Skip non-root jobs

            // Try to get the flow tree
            try {
              const flowTree = await this.flowProducer!.getFlow({
                id: job.id,
                queueName,
              });

              if (flowTree?.children && flowTree.children.length > 0) {
                // Count jobs in the tree
                const stats = this.countFlowStats(flowTree);

                const state = await job.getState();

                flows.push({
                  id: job.id,
                  name: job.name,
                  queueName,
                  status: state as JobStatus,
                  totalJobs: stats.total,
                  completedJobs: stats.completed,
                  failedJobs: stats.failed,
                  timestamp: job.timestamp,
                  duration:
                    job.finishedOn && job.processedOn
                      ? job.finishedOn - job.processedOn
                      : undefined,
                });

                if (flows.length >= limit) {
                  return flows.sort((a, b) => b.timestamp - a.timestamp);
                }
              }
            } catch {
              // Job might not have a flow, skip
            }
          }
        } catch {
          // Queue might not support this state, skip
        }
      }
    }

    return flows.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get a single flow tree by root job ID
   */
  async getFlow(queueName: string, jobId: string): Promise<FlowNode | null> {
    if (!this.flowProducer) {
      return null;
    }

    try {
      const flowTree = await this.flowProducer.getFlow({
        id: jobId,
        queueName,
      });

      if (!flowTree) {
        return null;
      }

      return this.convertFlowTree(flowTree);
    } catch {
      return null;
    }
  }

  /**
   * Create a new flow
   */
  async createFlow(request: CreateFlowRequest): Promise<{ id: string }> {
    if (!this.flowProducer) {
      throw new Error("FlowProducer not initialized");
    }

    const flowJob = this.buildFlowJob(request);
    const result = await this.flowProducer.add(flowJob);

    return { id: result.job.id || "" };
  }

  /**
   * Build a FlowJob from CreateFlowRequest or CreateFlowChildRequest
   */
  private buildFlowJob(
    request: CreateFlowRequest | CreateFlowChildRequest,
  ): any {
    const result: any = {
      name: request.name,
      queueName: request.queueName,
      data: request.data || {},
    };

    if (request.children && request.children.length > 0) {
      result.children = request.children.map((child) =>
        this.buildFlowJob(child),
      );
    }

    return result;
  }

  /**
   * Convert BullMQ flow tree to our FlowNode structure
   */
  private async convertFlowTree(tree: any): Promise<FlowNode> {
    const job = tree.job;
    const state = await job.getState();
    const duration =
      job.finishedOn && job.processedOn
        ? job.finishedOn - job.processedOn
        : undefined;

    const jobInfo: JobInfo = {
      id: job.id || "",
      name: job.name,
      data: job.data,
      opts: {
        attempts: job.opts?.attempts,
        delay: job.opts?.delay,
        priority: job.opts?.priority,
      },
      progress:
        typeof job.progress === "number"
          ? job.progress
          : typeof job.progress === "object"
            ? job.progress
            : 0,
      attemptsMade: job.attemptsMade || 0,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      timestamp: job.timestamp,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      returnvalue: job.returnvalue,
      status: state as JobStatus,
      duration,
      tags: this.extractTags(job.data),
    };

    const children: FlowNode[] = [];
    if (tree.children && tree.children.length > 0) {
      for (const child of tree.children) {
        children.push(await this.convertFlowTree(child));
      }
    }

    return {
      job: jobInfo,
      queueName: job.queueName || tree.queueName || "",
      children: children.length > 0 ? children : undefined,
    };
  }

  /**
   * Count statistics for a flow tree
   */
  private countFlowStats(tree: any): {
    total: number;
    completed: number;
    failed: number;
  } {
    let total = 1;
    let completed = 0;
    let failed = 0;

    // Check current job status (synchronously from available data)
    const job = tree.job;
    if (job.finishedOn && !job.failedReason) {
      completed = 1;
    } else if (job.failedReason) {
      failed = 1;
    }

    if (tree.children) {
      for (const child of tree.children) {
        const childStats = this.countFlowStats(child);
        total += childStats.total;
        completed += childStats.completed;
        failed += childStats.failed;
      }
    }

    return { total, completed, failed };
  }
}
