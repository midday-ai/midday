import { FlowProducer, type Job, type Queue } from "bullmq";
import { LRUCache } from "lru-cache";
import type {
  ActivityBucket,
  ActivityStatsResponse,
  CreateFlowChildRequest,
  CreateFlowRequest,
  DelayedJobInfo,
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
  RunInfo,
  RunInfoList,
  SchedulerInfo,
  SearchResult,
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

  // LRU cache for expensive operations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cache = new LRUCache<string, any>({
    max: 100, // Max 100 entries
    ttl: 1000 * 60, // Default 1 minute TTL
    allowStale: false, // Don't return stale entries
    updateAgeOnGet: true, // Reset TTL on access
  });

  private readonly CACHE_TTL = {
    metrics: 5 * 60 * 1000, // 5 minutes - metrics are expensive
    overview: 2 * 60 * 1000, // 2 minutes
    queues: 2 * 60 * 1000, // 2 minutes
    flows: 2 * 60 * 1000, // 2 minutes
    activity: 5 * 60 * 1000, // 5 minutes - activity timeline
  };

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
   * Get cached value or compute and cache
   */
  private async cached<T>(
    key: string,
    ttl: number,
    compute: () => Promise<T>,
  ): Promise<T> {
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      return cached as T;
    }

    const data = await compute();
    this.cache.set(key, data, { ttl });
    return data;
  }

  /**
   * Execute a promise with a timeout
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage: string,
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs),
      ),
    ]);
  }

  /**
   * Get jobs by time range using Redis sorted sets (ZRANGEBYSCORE)
   * This is more efficient than fetching all jobs and filtering in memory
   */
  private async getJobsByTimeRange(
    queue: Queue,
    status: "completed" | "failed",
    startTime: number,
    endTime: number,
    limit: number,
  ): Promise<Job[]> {
    try {
      // Access BullMQ's Redis client
      const client = (queue as any).client;
      if (!client) {
        // Fallback to regular getJobs if client not available
        const jobs = await queue.getJobs([status], 0, limit * 2);
        return jobs.filter(
          (job) =>
            job.finishedOn &&
            job.finishedOn >= startTime &&
            job.finishedOn <= endTime,
        );
      }

      // BullMQ stores jobs in sorted sets: bull:queueName:completed, bull:queueName:failed
      // The score is the finishedOn timestamp
      const queueKey = `bull:${queue.name}:${status}`;
      const jobIds = await client.zrangebyscore(
        queueKey,
        startTime,
        endTime,
        "LIMIT",
        0,
        limit,
      );

      if (!jobIds || jobIds.length === 0) {
        return [];
      }

      // Fetch job data for the IDs in parallel
      const jobPromises = jobIds.map((jobId: string) => queue.getJob(jobId));
      const jobs = await Promise.all(jobPromises);

      // Filter out null/undefined results
      return jobs.filter(
        (job): job is Job => job !== null && job !== undefined,
      );
    } catch (_error) {
      // Fallback to regular getJobs on error
      const jobs = await queue.getJobs([status], 0, limit * 2);
      return jobs.filter(
        (job) =>
          job.finishedOn &&
          job.finishedOn >= startTime &&
          job.finishedOn <= endTime,
      );
    }
  }

  /**
   * Cache for job state lookups to avoid repeated Redis calls
   */
  private jobStateCache = new LRUCache<string, JobStatus>({
    max: 1000,
    ttl: 1000 * 30, // 30 second TTL - job states don't change frequently
  });

  /**
   * Cache for job counts to avoid repeated Redis calls
   * Short TTL since counts change frequently but are expensive to fetch
   */
  private countCache = new LRUCache<
    string,
    Awaited<ReturnType<Queue["getJobCounts"]>>
  >({
    max: 100, // Cache counts for up to 100 queues
    ttl: 1000 * 5, // 5 second TTL - counts change but not instantly
  });

  /**
   * Get job counts with caching
   */
  private async getCachedJobCounts(
    queue: Queue,
  ): Promise<Awaited<ReturnType<Queue["getJobCounts"]>>> {
    const cacheKey = queue.name;
    const cached = this.countCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const counts = await queue.getJobCounts();
    this.countCache.set(cacheKey, counts);
    return counts;
  }

  /**
   * Invalidate caches related to a job or queue
   */
  private invalidateJobCache(queueName: string, jobId?: string): void {
    // Invalidate count cache for the queue
    this.countCache.delete(queueName);

    // Invalidate job state cache if jobId provided
    if (jobId) {
      const stateCacheKey = `${queueName}:${jobId}`;
      this.jobStateCache.delete(stateCacheKey);
    }

    // Invalidate main cache entries that might be affected
    // These are expensive to recompute, so we invalidate them
    // to ensure accuracy after mutations
    this.cache.delete("metrics");
    this.cache.delete("overview");
    this.cache.delete("activity");
  }

  /**
   * Clear cache (useful after mutations)
   */
  clearCache(prefix?: string): void {
    if (prefix) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get quick job counts across all queues (lightweight, for smart polling)
   * Returns total counts per status - cached and very fast
   */
  async getQuickCounts(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    total: number;
    timestamp: number;
  }> {
    // Use short cache for counts - they change frequently
    return this.cached("quick-counts", 2000, async () => {
      const totals = {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        total: 0,
        timestamp: Date.now(),
      };

      await Promise.all(
        Array.from(this.queues.values()).map(async (queue) => {
          const counts = await this.getCachedJobCounts(queue);
          totals.waiting += counts.waiting || 0;
          totals.active += counts.active || 0;
          totals.completed += counts.completed || 0;
          totals.failed += counts.failed || 0;
          totals.delayed += counts.delayed || 0;
        }),
      );

      totals.total =
        totals.waiting +
        totals.active +
        totals.completed +
        totals.failed +
        totals.delayed;

      return totals;
    });
  }

  /**
   * Get configured tag field names
   */
  getTagFields(): string[] {
    return this.tagFields;
  }

  /**
   * Get just queue names (very fast, no Redis calls)
   * Used for sidebar initial render
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
   * Get information for all queues (cached)
   */
  async getQueues(): Promise<QueueInfo[]> {
    return this.cached("queues", this.CACHE_TTL.queues, async () => {
      // Parallelize queue info fetching
      const queueEntries = Array.from(this.queues.entries());
      const results = await Promise.all(
        queueEntries.map(async ([name, queue]) => {
          const [counts, isPaused] = await Promise.all([
            this.getCachedJobCounts(queue),
            queue.isPaused(),
          ]);

          return {
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
          };
        }),
      );

      return results;
    });
  }

  /**
   * Get overview statistics (cached)
   */
  async getOverview(): Promise<OverviewStats> {
    return this.cached("overview", this.CACHE_TTL.overview, async () => {
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
    });
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
   * Get metrics for the last 24 hours (cached - expensive operation)
   */
  async getMetrics(): Promise<MetricsResponse> {
    return this.cached("metrics", this.CACHE_TTL.metrics, async () => {
      return this.withTimeout(
        (async () => {
          const now = Date.now();
          const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

          // Initialize hourly buckets for last 24 hours
          const createEmptyBuckets = (): HourlyBucket[] => {
            const buckets: HourlyBucket[] = [];
            const startHour =
              Math.floor(twentyFourHoursAgo / (60 * 60 * 1000)) *
              (60 * 60 * 1000);
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
            {
              name: string;
              queueName: string;
              completed: number;
              failed: number;
            }
          >();

          // Fetch completed and failed jobs from each queue IN PARALLEL
          // Use time-based filtering to only get jobs within the 24-hour window
          const queueEntries = Array.from(this.queues.entries());

          // First, check which queues have relevant jobs using getJobCounts
          const queueChecks = await Promise.all(
            queueEntries.map(async ([queueName, queue]) => {
              const counts = await this.getCachedJobCounts(queue);
              return {
                queueName,
                queue,
                hasRelevantJobs:
                  (counts.completed || 0) > 0 || (counts.failed || 0) > 0,
              };
            }),
          );

          // Only process queues with relevant jobs
          const relevantQueues = queueChecks.filter((q) => q.hasRelevantJobs);

          const queueResults = await Promise.all(
            relevantQueues.map(async ({ queueName, queue }) => {
              // Use time-based filtering - only fetch jobs within the 24-hour window
              // Reduced limit since we're filtering by time in Redis
              const [completedJobs, failedJobs] = await Promise.all([
                this.getJobsByTimeRange(
                  queue,
                  "completed",
                  twentyFourHoursAgo,
                  now,
                  100, // Reduced from 200 - only recent jobs needed
                ),
                this.getJobsByTimeRange(
                  queue,
                  "failed",
                  twentyFourHoursAgo,
                  now,
                  100, // Reduced from 200 - only recent jobs needed
                ),
              ]);
              return { queueName, completedJobs, failedJobs };
            }),
          );

          // Process results
          for (const { queueName, completedJobs, failedJobs } of queueResults) {
            const metrics = queueMetricsMap.get(queueName)!;

            // Process completed jobs
            for (const job of completedJobs) {
              if (
                !job ||
                !job.finishedOn ||
                job.finishedOn < twentyFourHoursAgo
              )
                continue;

              const bucketIndex = Math.floor(
                (job.finishedOn - (metrics.buckets[0]?.hour || 0)) /
                  (60 * 60 * 1000),
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

            // Process failed jobs
            for (const job of failedJobs) {
              if (
                !job ||
                !job.finishedOn ||
                job.finishedOn < twentyFourHoursAgo
              )
                continue;

              const bucketIndex = Math.floor(
                (job.finishedOn - (metrics.buckets[0]?.hour || 0)) /
                  (60 * 60 * 1000),
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

          // Skip per-queue metrics - not used by frontend (only aggregate is displayed)
          // Return empty array to maintain API compatibility

          // Build aggregate metrics
          const aggregateBuckets = createEmptyBuckets();
          const aggregateDurations: number[][] = Array.from(
            { length: 24 },
            () => [],
          );
          const aggregateWaitTimes: number[][] = Array.from(
            { length: 24 },
            () => [],
          );

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
          const totalFailed = aggregateBuckets.reduce(
            (sum, b) => sum + b.failed,
            0,
          );
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
            queues: [], // Empty - per-queue metrics not used by frontend
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
                        allDurations.reduce((a, b) => a + b, 0) /
                          allDurations.length,
                      )
                    : 0,
                avgWaitTime:
                  allWaitTimes.length > 0
                    ? Math.round(
                        allWaitTimes.reduce((a, b) => a + b, 0) /
                          allWaitTimes.length,
                      )
                    : 0,
                throughputPerHour: Math.round(
                  (totalCompleted + totalFailed) / 24,
                ),
              },
            },
            slowestJobs,
            mostFailingTypes,
            computedAt: now,
          };
        })(),
        45000, // 45 second timeout (before proxy timeout)
        "Metrics computation timed out after 45 seconds",
      );
    });
  }

  /**
   * Get activity stats for the last 7 days (cached)
   * Returns 4-hour buckets for the activity timeline
   */
  async getActivityStats(): Promise<ActivityStatsResponse> {
    return this.cached("activity", this.CACHE_TTL.activity, async () => {
      const now = Date.now();
      const bucketSize = 4 * 60 * 60 * 1000; // 4 hours
      const bucketCount = 42; // 7 days * 6 buckets per day

      // Start from midnight 7 days ago
      const startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(startDate.getDate() - 6);
      const startTime = startDate.getTime();

      // Initialize buckets
      const buckets: ActivityBucket[] = [];
      for (let i = 0; i < bucketCount; i++) {
        buckets.push({
          time: startTime + i * bucketSize,
          completed: 0,
          failed: 0,
        });
      }

      // Fetch completed and failed jobs from each queue IN PARALLEL
      // Use time-based filtering to only get jobs within the 7-day window
      const queueEntries = Array.from(this.queues.entries());

      // First, check which queues have relevant jobs
      const queueChecks = await Promise.all(
        queueEntries.map(async ([, queue]) => {
          const counts = await this.getCachedJobCounts(queue);
          return {
            queue,
            hasRelevantJobs:
              (counts.completed || 0) > 0 || (counts.failed || 0) > 0,
          };
        }),
      );

      // Only process queues with relevant jobs
      const relevantQueues = queueChecks.filter((q) => q.hasRelevantJobs);

      const queueResults = await Promise.all(
        relevantQueues.map(async ({ queue }) => {
          // Use time-based filtering - only fetch jobs within the 7-day window
          // Reduced limit since we're filtering by time in Redis
          const [completedJobs, failedJobs] = await Promise.all([
            this.getJobsByTimeRange(
              queue,
              "completed",
              startTime,
              now,
              200, // Reduced from 500 - only jobs in time range needed
            ),
            this.getJobsByTimeRange(
              queue,
              "failed",
              startTime,
              now,
              200, // Reduced from 500 - only jobs in time range needed
            ),
          ]);
          return { completedJobs, failedJobs };
        }),
      );

      // Process results
      for (const { completedJobs, failedJobs } of queueResults) {
        // Process completed jobs
        for (const job of completedJobs) {
          if (!job || !job.finishedOn || job.finishedOn < startTime) continue;

          const bucketIndex = Math.floor(
            (job.finishedOn - startTime) / bucketSize,
          );
          if (bucketIndex >= 0 && bucketIndex < bucketCount) {
            buckets[bucketIndex].completed++;
          }
        }

        // Process failed jobs
        for (const job of failedJobs) {
          if (!job || !job.finishedOn || job.finishedOn < startTime) continue;

          const bucketIndex = Math.floor(
            (job.finishedOn - startTime) / bucketSize,
          );
          if (bucketIndex >= 0 && bucketIndex < bucketCount) {
            buckets[bucketIndex].failed++;
          }
        }
      }

      const totalCompleted = buckets.reduce((sum, b) => sum + b.completed, 0);
      const totalFailed = buckets.reduce((sum, b) => sum + b.failed, 0);

      return {
        buckets,
        startTime,
        endTime: now,
        bucketSize,
        totalCompleted,
        totalFailed,
        computedAt: now,
      };
    });
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

    // Fetch counts once before the loop (same for all types in a queue)
    const counts = await this.getCachedJobCounts(queue);

    // Track jobs with their known state to avoid getState() calls
    const jobsWithState: { job: Job; state: JobStatus }[] = [];
    let total = 0;

    for (const type of types) {
      const typeJobs = await queue.getJobs(type as any, start, start + limit);
      jobsWithState.push(
        ...typeJobs.map((job) => ({ job, state: type as JobStatus })),
      );

      const typeCount = counts[type as keyof typeof counts] || 0;
      total += typeCount;
    }

    // Convert to JobInfo - pass known state to skip expensive getState() calls
    const jobInfos = (await Promise.all(
      jobsWithState.map(({ job, state }) => this.jobToInfo(job, "full", state)),
    )) as JobInfo[];

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

    return this.jobToInfo(job, "full") as Promise<JobInfo>;
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
    this.invalidateJobCache(queueName, jobId);
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
    this.invalidateJobCache(queueName, jobId);
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
    this.invalidateJobCache(queueName, jobId);
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
   * Check if a raw job matches all provided filters (before conversion)
   * This is more efficient than converting to JobInfo first
   */
  private jobMatchesAllFilters(
    job: Job,
    filters: {
      status?: JobStatus;
      tags?: Record<string, string>;
      text?: string;
      timeRange?: { start: number; end: number };
    },
  ): boolean {
    // Status filter is handled by fetching only the requested status types
    // So we don't need to check it here - jobs are already filtered by type

    // Check time range filter (cheap - uses raw timestamps)
    if (filters.timeRange) {
      const jobTime = job.processedOn || job.finishedOn || job.timestamp || 0;
      if (
        jobTime < filters.timeRange.start ||
        jobTime > filters.timeRange.end
      ) {
        return false;
      }
    }

    // Check tag filters (extract only needed fields from job.data)
    if (filters.tags && Object.keys(filters.tags).length > 0) {
      if (!job.data || typeof job.data !== "object") {
        return false;
      }
      const dataObj = job.data as Record<string, unknown>;
      for (const [field, value] of Object.entries(filters.tags)) {
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
    }

    // Check text search (only stringify if needed)
    if (filters.text) {
      const lowerText = filters.text.toLowerCase();
      const matchesId = job.id?.toLowerCase().includes(lowerText);
      const matchesName = job.name?.toLowerCase().includes(lowerText);

      if (!matchesId && !matchesName) {
        // Only stringify job.data if ID and name don't match
        const stringifiedData = JSON.stringify(job.data).toLowerCase();
        if (!stringifiedData.includes(lowerText)) {
          return false;
        }
      }
    }

    return true;
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
   * Optimized with parallel processing, early exits, and count checks
   */
  async search(query: string, limit = 20): Promise<SearchResult[]> {
    const { filters, text } = this.parseSearchQuery(query);
    const lowerText = text.toLowerCase();
    const hasFilters = Object.keys(filters).length > 0;
    const hasText = lowerText.length > 0;

    // Early exit if no search criteria
    if (!hasFilters && !hasText) {
      return [];
    }

    // Check counts first to skip empty queues
    const queueEntries = Array.from(this.queues.entries());
    const queueChecks = await Promise.all(
      queueEntries.map(async ([queueName, queue]) => {
        const counts = await this.getCachedJobCounts(queue);
        const hasJobs =
          (counts.waiting || 0) > 0 ||
          (counts.active || 0) > 0 ||
          (counts.completed || 0) > 0 ||
          (counts.failed || 0) > 0 ||
          (counts.delayed || 0) > 0;
        return { queueName, queue, hasJobs };
      }),
    );

    const relevantQueues = queueChecks.filter((q) => q.hasJobs);
    if (relevantQueues.length === 0) {
      return [];
    }

    // Process all queues in parallel instead of sequentially
    const types = ["waiting", "active", "completed", "failed", "delayed"];
    const fetchLimit = Math.min(limit * 2, 50); // Reduced from 100 - only fetch what we need

    // WeakMap for caching stringified job data
    const stringifiedDataCache = new WeakMap<Job, string>();

    // Process all queues concurrently
    const queueResults = await Promise.allSettled(
      relevantQueues.map(async ({ queueName, queue }) => {
        // Search in all job states in parallel
        const typeResults = await Promise.all(
          types.map(async (type) => {
            try {
              const jobs = await queue.getJobs(type as any, 0, fetchLimit);
              const matches: SearchResult[] = [];

              for (const job of jobs) {
                // Check field:value filters first
                if (hasFilters && !this.jobMatchesFilters(job, filters)) {
                  continue;
                }

                // If there's text search, match by job ID, name, or data
                if (hasText) {
                  const matchesId = job.id?.toLowerCase().includes(lowerText);
                  const matchesName = job.name
                    ?.toLowerCase()
                    .includes(lowerText);

                  // Only stringify if ID and name don't match (expensive operation)
                  let matchesData = false;
                  if (!matchesId && !matchesName) {
                    // Use cached stringified data if available
                    let stringifiedData = stringifiedDataCache.get(job);
                    if (!stringifiedData) {
                      stringifiedData = JSON.stringify(job.data).toLowerCase();
                      stringifiedDataCache.set(job, stringifiedData);
                    }
                    matchesData = stringifiedData.includes(lowerText);
                  }

                  if (!matchesId && !matchesName && !matchesData) {
                    continue;
                  }
                }

                // Pass known state to skip expensive getState() calls
                matches.push({
                  queue: queueName,
                  job: (await this.jobToInfo(
                    job,
                    "full",
                    type as JobStatus,
                  )) as JobInfo,
                });
              }

              return matches;
            } catch {
              return [];
            }
          }),
        );

        return typeResults.flat();
      }),
    );

    // Collect all matches from all queues
    const allMatches: SearchResult[] = [];
    for (const result of queueResults) {
      if (result.status === "fulfilled") {
        allMatches.push(...result.value);
      }
    }

    // Return limited results
    return allMatches.slice(0, limit);
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
   * FAST PATH: Get latest runs without filters
   * Optimized for the common case of viewing newest jobs (timestamp desc, no filters)
   * - Single getJobs call per queue (not per status type)
   * - No count checks needed
   * - Minimal Redis round-trips
   */
  private async getLatestRuns(
    limit: number,
    start: number,
  ): Promise<PaginatedResponse<RunInfoList>> {
    const queueEntries = Array.from(this.queues.entries());
    const numQueues = queueEntries.length;

    if (numQueues === 0) {
      return { data: [], total: -1, hasMore: false, cursor: undefined };
    }

    // Fetch a small number of recent jobs from each queue
    // We need enough to fill the page after sorting by timestamp
    const perQueueFetch = Math.max(5, Math.ceil((limit + 10) / numQueues) + 2);

    // Fetch from all queues in parallel - single call per queue with all types
    const allTypes: JobStatus[] = [
      "waiting",
      "active",
      "completed",
      "failed",
      "delayed",
    ];

    const results = await Promise.all(
      queueEntries.map(async ([queueName, queue]) => {
        // Single getJobs call with all types - much faster than 5 separate calls
        const jobs = await queue.getJobs(allTypes as any, 0, perQueueFetch);
        return jobs.map((job) => ({ job, queueName }));
      }),
    );

    // Flatten and sort by timestamp desc
    const allJobs = results.flat();
    allJobs.sort((a, b) => {
      const timeDiff = (b.job.timestamp || 0) - (a.job.timestamp || 0);
      if (timeDiff !== 0) return timeDiff;
      // Secondary sort for stability
      return a.queueName.localeCompare(b.queueName);
    });

    // Apply pagination
    const jobsToConvert = allJobs.slice(start, start + limit);

    // Convert to RunInfoList - infer state from job properties
    const runInfos = await Promise.all(
      jobsToConvert.map(async ({ job, queueName }) => {
        // Infer state from job properties to avoid getState() Redis call
        let state: JobStatus = "waiting";
        if (job.finishedOn) {
          state = job.failedReason ? "failed" : "completed";
        } else if (job.processedOn) {
          state = "active";
        } else if (job.delay && job.delay > 0) {
          state = "delayed";
        }

        const info = await this.jobToInfo(job, "list", state);
        return { ...info, queueName } as RunInfoList;
      }),
    );

    // Determine if there are more results
    const hasMore = allJobs.length > start + limit;

    return {
      data: runInfos,
      total: -1, // Don't calculate total for fast path - not needed for UI
      hasMore,
      cursor: hasMore ? String(start + runInfos.length) : undefined,
    };
  }

  /**
   * Get all runs (jobs) across all queues with sorting and filtering
   * Uses fast path for common case (no filters, timestamp desc)
   */
  async getAllRuns(
    limit = 50,
    start = 0,
    sort?: SortOptions,
    filters?: {
      status?: JobStatus;
      tags?: Record<string, string>;
      text?: string;
      timeRange?: { start: number; end: number };
    },
  ): Promise<PaginatedResponse<RunInfoList>> {
    const sortField = sort?.field ?? "timestamp";
    const sortDir = sort?.direction === "asc" ? 1 : -1;
    const hasFilters = !!(
      filters?.status ||
      filters?.tags ||
      filters?.text ||
      filters?.timeRange
    );
    const isTimestampSort = sortField === "timestamp";

    // FAST PATH: No filters, timestamp desc = just get newest jobs
    // This is the most common use case and should be instant
    if (!hasFilters && isTimestampSort && sortDir === -1) {
      return this.getLatestRuns(limit, start);
    }

    // FILTERED PATH: More complex queries need full filtering logic
    const queueEntries = Array.from(this.queues.entries());

    // Determine which job types to fetch based on status filter
    const types = filters?.status
      ? [filters.status]
      : ["waiting", "active", "completed", "failed", "delayed"];

    const hasTimeRange = !!filters?.timeRange;
    const numQueues = Math.max(queueEntries.length, 1);

    if (queueEntries.length === 0) {
      return {
        data: [],
        total: 0,
        hasMore: false,
        cursor: undefined,
      };
    }

    // For filtered queries, fetch enough to likely fill one page after filtering
    // Reduced from 50 to be smarter about distribution
    const baseFetchPerQueue = Math.max(
      Math.ceil((limit * 2) / numQueues) + 3,
      5,
    );

    let allJobs: { job: Job; queueName: string; state: JobStatus }[] = [];

    // Helper function to fetch from a single queue
    const fetchFromQueue = async (
      queueName: string,
      queue: Queue,
      fetchCount: number,
    ) => {
      // Use time-range queries for completed/failed jobs when time range is specified
      if (hasTimeRange && filters?.timeRange) {
        const timeRangeJobs: { job: Job; state: JobStatus }[] = [];

        // Use efficient time-range queries for completed/failed
        if (types.includes("completed")) {
          const completedJobs = await this.getJobsByTimeRange(
            queue,
            "completed",
            filters.timeRange.start,
            filters.timeRange.end,
            fetchCount,
          );
          timeRangeJobs.push(
            ...completedJobs.map((job) => ({
              job,
              state: "completed" as JobStatus,
            })),
          );
        }

        if (types.includes("failed")) {
          const failedJobs = await this.getJobsByTimeRange(
            queue,
            "failed",
            filters.timeRange.start,
            filters.timeRange.end,
            fetchCount,
          );
          timeRangeJobs.push(
            ...failedJobs.map((job) => ({
              job,
              state: "failed" as JobStatus,
            })),
          );
        }

        // For other types, use regular getJobs
        const otherTypes = types.filter(
          (t) => t !== "completed" && t !== "failed",
        );
        if (otherTypes.length > 0) {
          const otherJobArrays = await Promise.all(
            otherTypes.map(async (type) => {
              const jobs = await queue.getJobs(type as any, 0, fetchCount);
              return jobs.map((job) => ({ job, state: type as JobStatus }));
            }),
          );
          timeRangeJobs.push(...otherJobArrays.flat());
        }

        return timeRangeJobs.map(({ job, state }) => ({
          job,
          queueName,
          state,
        }));
      }

      // For status filter, only fetch that type
      if (filters?.status) {
        const jobs = await queue.getJobs(filters.status as any, 0, fetchCount);
        return jobs.map((job) => ({
          job,
          queueName,
          state: filters.status as JobStatus,
        }));
      }

      // Regular fetching for all types - track state for each type
      const jobArrays = await Promise.all(
        types.map(async (type) => {
          const jobs = await queue.getJobs(type as any, 0, fetchCount);
          return jobs.map((job) => ({ job, state: type as JobStatus }));
        }),
      );
      return jobArrays
        .flat()
        .map(({ job, state }) => ({ job, queueName, state }));
    };

    // Fetch from ALL queues in parallel
    const results = await Promise.all(
      queueEntries.map(([queueName, queue]) =>
        fetchFromQueue(queueName, queue, baseFetchPerQueue),
      ),
    );
    allJobs = results.flat();

    // Apply filters BEFORE sorting and pagination
    if (filters) {
      allJobs = allJobs.filter(({ job }) =>
        this.jobMatchesAllFilters(job, filters),
      );
    }

    // Sort all filtered jobs to ensure consistent ordering
    // sortDir: 1 = asc (oldest first), -1 = desc (newest first, default)
    if (isTimestampSort) {
      allJobs.sort((a, b) => {
        const aTime = a.job.timestamp || 0;
        const bTime = b.job.timestamp || 0;
        // Primary sort by timestamp
        const timeDiff = sortDir === -1 ? bTime - aTime : aTime - bTime;
        if (timeDiff !== 0) return timeDiff;
        // Secondary sort by queueName for stability
        const queueDiff = a.queueName.localeCompare(b.queueName);
        if (queueDiff !== 0) return queueDiff;
        // Tertiary sort by job ID for complete stability
        return (a.job.id || "").localeCompare(b.job.id || "");
      });
    }

    // Apply pagination
    const jobsToConvert = allJobs.slice(start, start + limit);

    // Convert only the jobs we'll return
    const runInfos = await Promise.all(
      jobsToConvert.map(async ({ job, queueName, state }) => {
        const info = await this.jobToInfo(job, "list", state);
        return { ...info, queueName } as RunInfoList;
      }),
    );

    // For non-timestamp sorting, sort after conversion
    if (!isTimestampSort) {
      runInfos.sort((a, b) => {
        const aVal = this.getSortValueForList(a, sortField);
        const bVal = this.getSortValueForList(b, sortField);
        if (aVal < bVal) return -1 * sortDir;
        if (aVal > bVal) return 1 * sortDir;
        return 0;
      });
    }

    // Build cursor for next page
    const hasMore = allJobs.length > start + limit;

    return {
      data: runInfos,
      total: -1, // Don't calculate total - not needed for UI
      hasMore,
      cursor: hasMore ? String(start + runInfos.length) : undefined,
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

    // Fetch from all queues in parallel
    const queueEntries = Array.from(this.queues.entries());
    const results = await Promise.all(
      queueEntries.map(async ([queueName, queue]) => {
        const [repeatableJobs, delayedJobs] = await Promise.all([
          queue.getRepeatableJobs(),
          queue.getJobs("delayed", 0, 50),
        ]);
        return { queueName, repeatableJobs, delayedJobs };
      }),
    );

    // Process results
    for (const { queueName, repeatableJobs, delayedJobs } of results) {
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
    const types = ["waiting", "active", "completed", "failed", "delayed"];

    // Fetch jobs from all queues in parallel
    const queueEntries = Array.from(this.queues.entries());
    const queueResults = await Promise.all(
      queueEntries.map(async ([, queue]) => {
        const jobArrays = await Promise.all(
          types.map((type) => queue.getJobs(type as any, 0, 100)),
        );
        return jobArrays.flat();
      }),
    );

    // Process all jobs
    for (const jobs of queueResults) {
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
   * Get sortable value from RunInfoList (lightweight version)
   */
  private getSortValueForList(
    item: RunInfoList,
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
        return item.queueName.toLowerCase();
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
   * Convert a BullMQ Job to JobInfo or RunInfoList
   * @param job - The BullMQ job to convert
   * @param fields - "list" for lightweight list view, "full" for complete job details
   * @param knownState - Optional: skip getState() call if state is already known from fetch
   */
  private async jobToInfo(
    job: Job,
    _fields: "list" | "full" = "full",
    knownState?: JobStatus,
  ): Promise<JobInfo | RunInfoList> {
    // Use known state if provided (avoids expensive Redis getState() call)
    // Otherwise use cached state, or fetch and cache
    let state = knownState;
    if (!state) {
      const cacheKey = `${job.queueName}:${job.id}`;
      state = this.jobStateCache.get(cacheKey);
      if (!state) {
        state = (await job.getState()) as JobStatus;
        this.jobStateCache.set(cacheKey, state);
      }
    }
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
   * Processed in parallel for better performance
   */
  async bulkRetry(
    jobs: { queueName: string; jobId: string }[],
  ): Promise<{ success: number; failed: number }> {
    const results = await Promise.allSettled(
      jobs.map(async ({ queueName, jobId }) => {
        const queue = this.queues.get(queueName);
        if (!queue) {
          throw new Error("Queue not found");
        }

        const job = await queue.getJob(jobId);
        if (!job) {
          throw new Error("Job not found");
        }

        await job.retry();
        this.invalidateJobCache(queueName, jobId);
        return { success: true };
      }),
    );

    let success = 0;
    let failed = 0;
    for (const result of results) {
      if (result.status === "fulfilled") {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Delete multiple jobs across queues
   * Processed in parallel for better performance
   */
  async bulkDelete(
    jobs: { queueName: string; jobId: string }[],
  ): Promise<{ success: number; failed: number }> {
    const results = await Promise.allSettled(
      jobs.map(async ({ queueName, jobId }) => {
        const queue = this.queues.get(queueName);
        if (!queue) {
          throw new Error("Queue not found");
        }

        const job = await queue.getJob(jobId);
        if (!job) {
          throw new Error("Job not found");
        }

        await job.remove();
        this.invalidateJobCache(queueName, jobId);
        return { success: true };
      }),
    );

    let success = 0;
    let failed = 0;
    for (const result of results) {
      if (result.status === "fulfilled") {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Promote multiple delayed jobs across queues (move to waiting)
   * Processed in parallel for better performance
   */
  async bulkPromote(
    jobs: { queueName: string; jobId: string }[],
  ): Promise<{ success: number; failed: number }> {
    const results = await Promise.allSettled(
      jobs.map(async ({ queueName, jobId }) => {
        const queue = this.queues.get(queueName);
        if (!queue) {
          throw new Error("Queue not found");
        }

        const job = await queue.getJob(jobId);
        if (!job) {
          throw new Error("Job not found");
        }

        await job.promote();
        this.invalidateJobCache(queueName, jobId);
        return { success: true };
      }),
    );

    let success = 0;
    let failed = 0;
    for (const result of results) {
      if (result.status === "fulfilled") {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Flow Operations
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get all flows (jobs that have children or are part of a flow) - cached
   * Optimized to focus on waiting-children type first and early exit
   */
  async getFlows(limit = 50): Promise<FlowSummary[]> {
    if (!this.flowProducer) {
      return [];
    }

    return this.cached(`flows:${limit}`, this.CACHE_TTL.flows, async () => {
      const queueEntries = Array.from(this.queues.entries());

      // Check counts first to skip empty queues
      const queueChecks = await Promise.all(
        queueEntries.map(async ([queueName, queue]) => {
          const counts = await this.getCachedJobCounts(queue);
          const hasRelevantJobs =
            (counts.waiting || 0) > 0 ||
            (counts["waiting-children"] || 0) > 0 ||
            (counts.active || 0) > 0;
          return { queueName, queue, hasRelevantJobs };
        }),
      );

      const relevantQueues = queueChecks.filter((q) => q.hasRelevantJobs);
      if (relevantQueues.length === 0) {
        return [];
      }

      // Focus on waiting-children first (most likely to be flows)
      // Then check other types with reduced limits
      const queueResults = await Promise.all(
        relevantQueues.map(async ({ queueName, queue }) => {
          try {
            // Fetch waiting-children first (most likely flows) with higher limit
            const waitingChildrenJobs = await queue.getJobs(
              ["waiting-children"],
              0,
              50,
            );

            // If we already have enough flows, skip other types
            if (waitingChildrenJobs.length >= limit) {
              return { queueName, jobs: waitingChildrenJobs };
            }

            // Fetch other types with reduced limits
            const otherTypes = [
              "waiting",
              "active",
              "completed",
              "failed",
              "delayed",
            ];
            const otherJobArrays = await Promise.all(
              otherTypes.map(async (type) => {
                try {
                  return await queue.getJobs(type as any, 0, 30); // Reduced from 100
                } catch {
                  return [];
                }
              }),
            );

            const allJobs = [...waitingChildrenJobs, ...otherJobArrays.flat()];
            return { queueName, jobs: allJobs };
          } catch {
            return { queueName, jobs: [] };
          }
        }),
      );

      // Collect potential root jobs (no parent)
      // Early exit when we have enough flows
      const seenJobIds = new Set<string>();
      const potentialRoots: { queueName: string; job: Job }[] = [];

      for (const { queueName, jobs } of queueResults) {
        // Early exit if we have enough flows
        if (potentialRoots.length >= limit * 2) {
          break;
        }

        for (const job of jobs) {
          if (!job || !job.id) continue;

          const jobKey = `${queueName}:${job.id}`;
          if (seenJobIds.has(jobKey)) continue;
          seenJobIds.add(jobKey);

          // Check if this is a root job (has no parent)
          const hasParent = !!job.parent || !!job.parentKey;
          if (!hasParent) {
            potentialRoots.push({ queueName, job });

            // Early exit if we have enough potential roots
            if (potentialRoots.length >= limit * 2) {
              break;
            }
          }
        }
      }

      // Check flows in parallel (batch to avoid overwhelming Redis)
      const batchSize = 20;
      const flows: FlowSummary[] = [];

      for (
        let i = 0;
        i < potentialRoots.length && flows.length < limit;
        i += batchSize
      ) {
        const batch = potentialRoots.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async ({ queueName, job }) => {
            try {
              const flowTree = await this.flowProducer!.getFlow({
                id: job.id!,
                queueName,
              });

              if (flowTree?.children && flowTree.children.length > 0) {
                const stats = this.countFlowStats(flowTree);
                const state = await job.getState();

                return {
                  id: job.id!,
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
                } as FlowSummary;
              }
            } catch {
              // Job might not have a flow, skip
            }
            return null;
          }),
        );

        for (const result of batchResults) {
          if (result && flows.length < limit) {
            flows.push(result);
          }
        }
      }

      return flows.sort((a, b) => b.timestamp - a.timestamp);
    });
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
