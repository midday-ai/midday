import { getQueue, getQueues } from "@/lib/queues";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";

export const jobsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        queueName: z.string(),
        status: z.enum(["waiting", "active", "completed", "failed", "delayed"]),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input }) => {
      const queue = getQueue(input.queueName);

      if (!queue) {
        throw new Error(`Queue "${input.queueName}" not found`);
      }

      const start = (input.page - 1) * input.pageSize;
      const end = start + input.pageSize - 1;

      let jobs: any[] = [];

      try {
        switch (input.status) {
          case "waiting":
            jobs = await queue.getWaiting(start, end);
            break;
          case "active":
            jobs = await queue.getActive(start, end);
            break;
          case "completed":
            jobs = await queue.getCompleted(start, end);
            break;
          case "failed":
            jobs = await queue.getFailed(start, end);
            break;
          case "delayed":
            jobs = await queue.getDelayed(start, end);
            break;
        }
      } catch (error) {
        console.error(`Error fetching ${input.status} jobs:`, error);
        jobs = [];
      }

      return {
        jobs: jobs.map((job) => ({
          id: job.id,
          name: job.name,
          data: job.data,
          opts: job.opts,
          progress: job.progress,
          attemptsMade: job.attemptsMade,
          timestamp: job.timestamp,
          processedOn: job.processedOn,
          finishedOn: job.finishedOn,
          failedReason: job.failedReason,
          stacktrace: job.stacktrace,
          returnvalue: job.returnvalue,
        })),
        page: input.page,
        pageSize: input.pageSize,
        total: jobs.length,
      };
    }),

  get: publicProcedure
    .input(
      z.object({
        queueName: z.string(),
        jobId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const queue = getQueue(input.queueName);

      if (!queue) {
        throw new Error(`Queue "${input.queueName}" not found`);
      }

      const job = await queue.getJob(input.jobId);

      if (!job) {
        throw new Error(`Job "${input.jobId}" not found`);
      }

      const state = await job.getState();

      return {
        id: job.id,
        name: job.name,
        data: job.data,
        opts: job.opts,
        progress: job.progress,
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
        stacktrace: job.stacktrace,
        returnvalue: job.returnvalue,
        state,
      };
    }),

  retry: publicProcedure
    .input(
      z.object({
        queueName: z.string(),
        jobId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const queue = getQueue(input.queueName);

      if (!queue) {
        throw new Error(`Queue "${input.queueName}" not found`);
      }

      const job = await queue.getJob(input.jobId);

      if (!job) {
        throw new Error(`Job "${input.jobId}" not found`);
      }

      await job.retry();
      return { success: true, message: "Job retried" };
    }),

  remove: publicProcedure
    .input(
      z.object({
        queueName: z.string(),
        jobId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const queue = getQueue(input.queueName);

      if (!queue) {
        throw new Error(`Queue "${input.queueName}" not found`);
      }

      const job = await queue.getJob(input.jobId);

      if (!job) {
        throw new Error(`Job "${input.jobId}" not found`);
      }

      await job.remove();
      return { success: true, message: "Job removed" };
    }),

  recent: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input }) => {
      try {
        const allQueues = Array.from(getQueues().values());

        // If no queues are initialized, return empty array
        if (allQueues.length === 0) {
          return [];
        }

        const allJobs: Array<{
          id: string;
          name: string;
          queueName: string;
          data: any;
          timestamp: number;
          processedOn?: number;
          finishedOn?: number;
          failedReason?: string;
          attemptsMade: number;
          status: "waiting" | "active" | "completed" | "failed" | "delayed";
          started: number;
          duration: number | null;
        }> = [];

        // Get recent jobs from all queues (all statuses)
        for (const queue of allQueues) {
          try {
            const [waiting, active, completed, failed, delayed] =
              await Promise.all([
                queue.getWaiting(0, input.limit - 1),
                queue.getActive(0, input.limit - 1),
                queue.getCompleted(0, input.limit - 1),
                queue.getFailed(0, input.limit - 1),
                queue.getDelayed(0, input.limit - 1),
              ]);

            for (const job of waiting) {
              const started = job.processedOn || job.timestamp || 0;
              allJobs.push({
                id: job.id!,
                name: job.name,
                queueName: queue.name,
                data: job.data,
                timestamp: job.timestamp || 0,
                processedOn: job.processedOn,
                finishedOn: job.finishedOn,
                attemptsMade: job.attemptsMade,
                status: "waiting",
                started,
                duration: null,
              });
            }

            for (const job of active) {
              const started = job.processedOn || job.timestamp || 0;
              allJobs.push({
                id: job.id!,
                name: job.name,
                queueName: queue.name,
                data: job.data,
                timestamp: job.timestamp || 0,
                processedOn: job.processedOn,
                finishedOn: job.finishedOn,
                attemptsMade: job.attemptsMade,
                status: "active",
                started,
                duration: null,
              });
            }

            for (const job of completed) {
              const started = job.processedOn || job.timestamp || 0;
              const duration =
                job.finishedOn && started ? job.finishedOn - started : null;
              allJobs.push({
                id: job.id!,
                name: job.name,
                queueName: queue.name,
                data: job.data,
                timestamp: job.timestamp || 0,
                processedOn: job.processedOn,
                finishedOn: job.finishedOn,
                attemptsMade: job.attemptsMade,
                status: "completed",
                started,
                duration,
              });
            }

            for (const job of failed) {
              const started = job.processedOn || job.timestamp || 0;
              const duration =
                job.finishedOn && started ? job.finishedOn - started : null;
              allJobs.push({
                id: job.id!,
                name: job.name,
                queueName: queue.name,
                data: job.data,
                timestamp: job.timestamp || 0,
                processedOn: job.processedOn,
                finishedOn: job.finishedOn,
                failedReason: job.failedReason,
                attemptsMade: job.attemptsMade,
                status: "failed",
                started,
                duration,
              });
            }

            for (const job of delayed) {
              const started = job.processedOn || job.timestamp || 0;
              allJobs.push({
                id: job.id!,
                name: job.name,
                queueName: queue.name,
                data: job.data,
                timestamp: job.timestamp || 0,
                processedOn: job.processedOn,
                finishedOn: job.finishedOn,
                attemptsMade: job.attemptsMade,
                status: "delayed",
                started,
                duration: null,
              });
            }
          } catch (error) {
            console.error(
              `Error fetching recent jobs from queue ${queue.name}:`,
              error,
            );
          }
        }

        // Sort by finishedOn, processedOn, or timestamp (most recent first)
        allJobs.sort((a, b) => {
          const timeA = a.finishedOn || a.processedOn || a.timestamp;
          const timeB = b.finishedOn || b.processedOn || b.timestamp;
          return timeB - timeA;
        });

        // Return only the requested limit
        return allJobs.slice(0, input.limit);
      } catch (error) {
        console.error("[jobs.recent] Error fetching recent jobs:", error);
        // Return empty array if there's an error
        return [];
      }
    }),

  activity: publicProcedure
    .input(
      z.object({
        hours: z.number().min(1).max(24).default(12),
      }),
    )
    .query(async ({ input }) => {
      try {
        const allQueues = Array.from(getQueues().values());

        // If no queues are initialized, return empty array
        if (allQueues.length === 0) {
          return [];
        }

        const now = Date.now();
        const hoursAgo = now - input.hours * 60 * 60 * 1000;

        // Create hour buckets
        const buckets: Map<
          string,
          { completed: number; failed: number; active: number }
        > = new Map();

        // Initialize all hour buckets with zeros
        for (let i = input.hours - 1; i >= 0; i--) {
          const bucketTime = new Date(now - i * 60 * 60 * 1000);
          bucketTime.setMinutes(0, 0, 0); // Round down to the hour
          const bucketKey = bucketTime.toISOString();
          buckets.set(bucketKey, { completed: 0, failed: 0, active: 0 });
        }

        // Get current active jobs count (for the most recent bucket)
        let currentActiveCount = 0;
        for (const queue of allQueues) {
          try {
            const activeCount = await queue.getActiveCount();
            currentActiveCount += activeCount;
          } catch (error) {
            console.error(
              `Error getting active count for queue ${queue.name}:`,
              error,
            );
          }
        }

        // Fetch completed and failed jobs from all queues
        // We need enough jobs to cover the time range
        const jobsToFetch = Math.max(input.hours * 100, 1000); // Estimate: ~100 jobs per hour

        for (const queue of allQueues) {
          try {
            const [completed, failed, active] = await Promise.all([
              queue.getCompleted(0, jobsToFetch - 1),
              queue.getFailed(0, jobsToFetch - 1),
              queue.getActive(0, jobsToFetch - 1),
            ]);

            // Process completed jobs
            for (const job of completed) {
              if (job.finishedOn && job.finishedOn >= hoursAgo) {
                const finishedTime = new Date(job.finishedOn);
                finishedTime.setMinutes(0, 0, 0); // Round down to the hour
                const bucketKey = finishedTime.toISOString();

                if (buckets.has(bucketKey)) {
                  const bucket = buckets.get(bucketKey)!;
                  bucket.completed++;
                }
              }
            }

            // Process failed jobs
            for (const job of failed) {
              if (job.finishedOn && job.finishedOn >= hoursAgo) {
                const finishedTime = new Date(job.finishedOn);
                finishedTime.setMinutes(0, 0, 0); // Round down to the hour
                const bucketKey = finishedTime.toISOString();

                if (buckets.has(bucketKey)) {
                  const bucket = buckets.get(bucketKey)!;
                  bucket.failed++;
                }
              }
            }

            // Process active jobs by processedOn timestamp
            for (const job of active) {
              const processedTime = job.processedOn || job.timestamp;
              if (processedTime && processedTime >= hoursAgo) {
                const processedDate = new Date(processedTime);
                processedDate.setMinutes(0, 0, 0); // Round down to the hour
                const bucketKey = processedDate.toISOString();

                if (buckets.has(bucketKey)) {
                  const bucket = buckets.get(bucketKey)!;
                  bucket.active++;
                }
              }
            }
          } catch (error) {
            console.error(
              `Error fetching activity data from queue ${queue.name}:`,
              error,
            );
          }
        }

        // Add current active count to the most recent bucket
        const sortedBucketKeys = Array.from(buckets.keys()).sort();
        const mostRecentBucketKey =
          sortedBucketKeys[sortedBucketKeys.length - 1];
        if (mostRecentBucketKey) {
          const bucket = buckets.get(mostRecentBucketKey)!;
          bucket.active = currentActiveCount;
        }

        // Convert buckets map to array and format for chart
        // Sort by ISO string keys (which are naturally chronological)
        const result = sortedBucketKeys.map((timeKey) => {
          const counts = buckets.get(timeKey)!;
          return {
            time: new Date(timeKey).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            completed: counts.completed,
            failed: counts.failed,
            active: counts.active,
          };
        });

        return result;
      } catch (error) {
        console.error("[jobs.activity] Error fetching activity data:", error);
        // Return empty array if there's an error
        return [];
      }
    }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        queueName: z.string().optional(),
        status: z
          .enum(["waiting", "active", "completed", "failed", "delayed"])
          .optional(),
        startDate: z.number().optional(),
        endDate: z.number().optional(),
        minDuration: z.number().optional(),
        maxDuration: z.number().optional(),
        jobName: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input }) => {
      try {
        const allQueues = Array.from(getQueues().values());
        const queueFilter = input.queueName
          ? allQueues.filter((q) => q.name === input.queueName)
          : allQueues;

        if (queueFilter.length === 0) {
          return {
            jobs: [],
            page: input.page,
            pageSize: input.pageSize,
            total: 0,
          };
        }

        const allJobs: Array<{
          id: string;
          name: string;
          queueName: string;
          data: any;
          timestamp: number;
          processedOn?: number;
          finishedOn?: number;
          failedReason?: string;
          attemptsMade: number;
          status: "waiting" | "active" | "completed" | "failed" | "delayed";
          started: number;
          duration: number | null;
        }> = [];

        // Fetch jobs from filtered queues
        const jobsToFetch = 1000; // Fetch enough to search through

        for (const queue of queueFilter) {
          try {
            const statuses = input.status
              ? [input.status]
              : ["waiting", "active", "completed", "failed", "delayed"];

            const jobPromises = statuses.map((status) => {
              switch (status) {
                case "waiting":
                  return queue.getWaiting(0, jobsToFetch - 1);
                case "active":
                  return queue.getActive(0, jobsToFetch - 1);
                case "completed":
                  return queue.getCompleted(0, jobsToFetch - 1);
                case "failed":
                  return queue.getFailed(0, jobsToFetch - 1);
                case "delayed":
                  return queue.getDelayed(0, jobsToFetch - 1);
              }
            });

            const jobArrays = await Promise.all(jobPromises);

            for (let i = 0; i < statuses.length; i++) {
              const jobs = jobArrays[i];
              const status = statuses[i] as
                | "waiting"
                | "active"
                | "completed"
                | "failed"
                | "delayed";

              if (!jobs) continue;

              for (const job of jobs) {
                const started = job.processedOn || job.timestamp || 0;
                const duration =
                  job.finishedOn && started ? job.finishedOn - started : null;

                allJobs.push({
                  id: job.id!,
                  name: job.name,
                  queueName: queue.name,
                  data: job.data,
                  timestamp: job.timestamp || 0,
                  processedOn: job.processedOn,
                  finishedOn: job.finishedOn,
                  failedReason: job.failedReason,
                  attemptsMade: job.attemptsMade,
                  status,
                  started,
                  duration,
                });
              }
            }
          } catch (error) {
            console.error(
              `Error fetching jobs from queue ${queue.name}:`,
              error,
            );
          }
        }

        // Apply filters
        let filteredJobs = allJobs;

        // Query filter (search in name, ID, queue, error message)
        if (input.query) {
          const queryLower = input.query.toLowerCase();
          filteredJobs = filteredJobs.filter((job) => {
            return (
              job.name.toLowerCase().includes(queryLower) ||
              job.id.toLowerCase().includes(queryLower) ||
              job.queueName.toLowerCase().includes(queryLower) ||
              job.failedReason?.toLowerCase().includes(queryLower)
            );
          });
        }

        // Job name filter
        if (input.jobName) {
          filteredJobs = filteredJobs.filter((job) =>
            job.name.toLowerCase().includes(input.jobName!.toLowerCase()),
          );
        }

        // Date range filter
        if (input.startDate || input.endDate) {
          filteredJobs = filteredJobs.filter((job) => {
            const jobTime = job.finishedOn || job.processedOn || job.timestamp;
            if (input.startDate && jobTime < input.startDate) return false;
            if (input.endDate && jobTime > input.endDate) return false;
            return true;
          });
        }

        // Duration filter
        if (
          input.minDuration !== undefined ||
          input.maxDuration !== undefined
        ) {
          filteredJobs = filteredJobs.filter((job) => {
            if (job.duration === null) return false;
            if (
              input.minDuration !== undefined &&
              job.duration < input.minDuration
            )
              return false;
            if (
              input.maxDuration !== undefined &&
              job.duration > input.maxDuration
            )
              return false;
            return true;
          });
        }

        // Sort by finishedOn, processedOn, or timestamp (most recent first)
        filteredJobs.sort((a, b) => {
          const timeA = a.finishedOn || a.processedOn || a.timestamp;
          const timeB = b.finishedOn || b.processedOn || b.timestamp;
          return timeB - timeA;
        });

        // Paginate
        const start = (input.page - 1) * input.pageSize;
        const end = start + input.pageSize;
        const paginatedJobs = filteredJobs.slice(start, end);

        return {
          jobs: paginatedJobs,
          page: input.page,
          pageSize: input.pageSize,
          total: filteredJobs.length,
        };
      } catch (error) {
        console.error("[jobs.search] Error searching jobs:", error);
        return {
          jobs: [],
          page: input.page,
          pageSize: input.pageSize,
          total: 0,
        };
      }
    }),

  bulkRetry: publicProcedure
    .input(
      z.object({
        jobIds: z.array(z.string()),
        queueName: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const queue = getQueue(input.queueName);
        if (!queue) {
          throw new Error(`Queue "${input.queueName}" not found`);
        }

        const results = await Promise.allSettled(
          input.jobIds.map(async (jobId) => {
            const job = await queue.getJob(jobId);
            if (!job) {
              throw new Error(`Job ${jobId} not found`);
            }
            await job.retry();
            return jobId;
          }),
        );

        const succeeded = results.filter(
          (r) => r.status === "fulfilled",
        ).length;
        const failed = results.filter((r) => r.status === "rejected").length;

        return {
          succeeded,
          failed,
          total: input.jobIds.length,
        };
      } catch (error) {
        console.error("[jobs.bulkRetry] Error:", error);
        throw error;
      }
    }),

  bulkRemove: publicProcedure
    .input(
      z.object({
        jobIds: z.array(z.string()),
        queueName: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const queue = getQueue(input.queueName);
        if (!queue) {
          throw new Error(`Queue "${input.queueName}" not found`);
        }

        const results = await Promise.allSettled(
          input.jobIds.map(async (jobId) => {
            const job = await queue.getJob(jobId);
            if (!job) {
              throw new Error(`Job ${jobId} not found`);
            }
            await job.remove();
            return jobId;
          }),
        );

        const succeeded = results.filter(
          (r) => r.status === "fulfilled",
        ).length;
        const failed = results.filter((r) => r.status === "rejected").length;

        return {
          succeeded,
          failed,
          total: input.jobIds.length,
        };
      } catch (error) {
        console.error("[jobs.bulkRemove] Error:", error);
        throw error;
      }
    }),

  bulkRetryWithDelay: publicProcedure
    .input(
      z.object({
        jobIds: z.array(z.string()),
        queueName: z.string(),
        delay: z.number().min(0).default(5000),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const queue = getQueue(input.queueName);
        if (!queue) {
          throw new Error(`Queue "${input.queueName}" not found`);
        }

        const results = await Promise.allSettled(
          input.jobIds.map(async (jobId) => {
            const job = await queue.getJob(jobId);
            if (!job) {
              throw new Error(`Job ${jobId} not found`);
            }
            // Remove the job and add it back with delay
            await job.remove();
            await queue.add(job.name, job.data, {
              ...job.opts,
              delay: input.delay,
            });
            return jobId;
          }),
        );

        const succeeded = results.filter(
          (r) => r.status === "fulfilled",
        ).length;
        const failed = results.filter((r) => r.status === "rejected").length;

        return {
          succeeded,
          failed,
          total: input.jobIds.length,
        };
      } catch (error) {
        console.error("[jobs.bulkRetryWithDelay] Error:", error);
        throw error;
      }
    }),

  copyJob: publicProcedure
    .input(
      z.object({
        queueName: z.string(),
        jobId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const queue = getQueue(input.queueName);
        if (!queue) {
          throw new Error(`Queue "${input.queueName}" not found`);
        }

        const originalJob = await queue.getJob(input.jobId);
        if (!originalJob) {
          throw new Error(`Job ${input.jobId} not found`);
        }

        // Create a new job with the same data and options
        const newJob = await queue.add(originalJob.name, originalJob.data, {
          ...originalJob.opts,
          jobId: undefined, // Let BullMQ generate a new ID
        });

        return {
          id: newJob.id!,
          name: newJob.name,
        };
      } catch (error) {
        console.error("[jobs.copyJob] Error:", error);
        throw error;
      }
    }),

  editAndRetry: publicProcedure
    .input(
      z.object({
        queueName: z.string(),
        jobId: z.string(),
        data: z.any().optional(),
        opts: z.any().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const queue = getQueue(input.queueName);
        if (!queue) {
          throw new Error(`Queue "${input.queueName}" not found`);
        }

        const originalJob = await queue.getJob(input.jobId);
        if (!originalJob) {
          throw new Error(`Job ${input.jobId} not found`);
        }

        // Create a new job with modified data/options
        const newJob = await queue.add(
          originalJob.name,
          input.data !== undefined ? input.data : originalJob.data,
          {
            ...originalJob.opts,
            ...(input.opts || {}),
            jobId: undefined, // Let BullMQ generate a new ID
          },
        );

        return {
          id: newJob.id!,
          name: newJob.name,
        };
      } catch (error) {
        console.error("[jobs.editAndRetry] Error:", error);
        throw error;
      }
    }),

  errors: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input }) => {
      try {
        const allQueues = Array.from(getQueues().values());
        const allFailedJobs: Array<{
          id: string;
          name: string;
          queueName: string;
          failedReason: string;
          stacktrace?: string[];
          timestamp: number;
          processedOn?: number;
        }> = [];

        // Fetch failed jobs from all queues
        for (const queue of allQueues) {
          try {
            const failed = await queue.getFailed(0, 1000);
            for (const job of failed) {
              if (job.failedReason) {
                allFailedJobs.push({
                  id: job.id!,
                  name: job.name,
                  queueName: queue.name,
                  failedReason: job.failedReason,
                  stacktrace: job.stacktrace,
                  timestamp: job.timestamp || 0,
                  processedOn: job.processedOn,
                });
              }
            }
          } catch (error) {
            console.error(
              `Error fetching failed jobs from queue ${queue.name}:`,
              error,
            );
          }
        }

        // Normalize error messages (remove timestamps, IDs, etc.)
        const normalizeError = (error: string): string => {
          return error
            .replace(
              /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[.\d]*Z/g,
              "[timestamp]",
            )
            .replace(
              /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
              "[id]",
            )
            .replace(/\d+/g, "[number]")
            .trim();
        };

        // Group by normalized error message and job name
        const errorGroups = new Map<
          string,
          {
            normalizedError: string;
            jobName: string;
            count: number;
            queues: Set<string>;
            recentJobs: Array<{
              id: string;
              queueName: string;
              timestamp: number;
              failedReason: string;
            }>;
          }
        >();

        for (const job of allFailedJobs) {
          const normalized = normalizeError(job.failedReason);
          const key = `${job.name}::${normalized}`;

          if (!errorGroups.has(key)) {
            errorGroups.set(key, {
              normalizedError: normalized,
              jobName: job.name,
              count: 0,
              queues: new Set(),
              recentJobs: [],
            });
          }

          const group = errorGroups.get(key)!;
          group.count++;
          group.queues.add(job.queueName);
          group.recentJobs.push({
            id: job.id,
            queueName: job.queueName,
            timestamp: job.timestamp,
            failedReason: job.failedReason,
          });
        }

        // Sort by count (most frequent first) and limit
        const sortedGroups = Array.from(errorGroups.values())
          .map((group) => ({
            ...group,
            queues: Array.from(group.queues),
            recentJobs: group.recentJobs
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, 5), // Keep only 5 most recent
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, input.limit);

        return sortedGroups;
      } catch (error) {
        console.error("[jobs.errors] Error fetching error groups:", error);
        return [];
      }
    }),

  analytics: publicProcedure
    .input(
      z.object({
        hours: z.number().min(1).max(168).default(24), // Default 24 hours, max 1 week
      }),
    )
    .query(async ({ input }) => {
      try {
        const allQueues = Array.from(getQueues().values());
        const cutoffTime = Date.now() - input.hours * 60 * 60 * 1000;

        // Collect all completed and failed jobs from the time window
        const completedJobs: Array<{
          name: string;
          queueName: string;
          duration: number;
          timestamp: number;
        }> = [];

        const failedJobs: Array<{
          name: string;
          queueName: string;
          timestamp: number;
        }> = [];

        for (const queue of allQueues) {
          try {
            // Get completed jobs
            const completed = await queue.getCompleted(0, 1000);
            for (const job of completed) {
              if (
                job.finishedOn &&
                job.processedOn &&
                job.finishedOn >= cutoffTime
              ) {
                const duration = job.finishedOn - job.processedOn;
                completedJobs.push({
                  name: job.name,
                  queueName: queue.name,
                  duration,
                  timestamp: job.finishedOn,
                });
              }
            }

            // Get failed jobs
            const failed = await queue.getFailed(0, 1000);
            for (const job of failed) {
              if (job.timestamp && job.timestamp >= cutoffTime) {
                failedJobs.push({
                  name: job.name,
                  queueName: queue.name,
                  timestamp: job.timestamp,
                });
              }
            }
          } catch (error) {
            console.error(
              `Error fetching analytics from queue ${queue.name}:`,
              error,
            );
          }
        }

        // Calculate metrics by job name
        const jobMetrics = new Map<
          string,
          {
            name: string;
            totalJobs: number;
            completedJobs: number;
            failedJobs: number;
            durations: number[];
            successRate: number;
            avgDuration: number;
            p95Duration: number;
            p99Duration: number;
          }
        >();

        // Process completed jobs
        for (const job of completedJobs) {
          if (!jobMetrics.has(job.name)) {
            jobMetrics.set(job.name, {
              name: job.name,
              totalJobs: 0,
              completedJobs: 0,
              failedJobs: 0,
              durations: [],
              successRate: 0,
              avgDuration: 0,
              p95Duration: 0,
              p99Duration: 0,
            });
          }
          const metric = jobMetrics.get(job.name)!;
          metric.completedJobs++;
          metric.totalJobs++;
          metric.durations.push(job.duration);
        }

        // Process failed jobs
        for (const job of failedJobs) {
          if (!jobMetrics.has(job.name)) {
            jobMetrics.set(job.name, {
              name: job.name,
              totalJobs: 0,
              completedJobs: 0,
              failedJobs: 0,
              durations: [],
              successRate: 0,
              avgDuration: 0,
              p95Duration: 0,
              p99Duration: 0,
            });
          }
          const metric = jobMetrics.get(job.name)!;
          metric.failedJobs++;
          metric.totalJobs++;
        }

        // Calculate statistics for each job
        const metrics = Array.from(jobMetrics.values()).map((metric) => {
          metric.successRate =
            metric.totalJobs > 0
              ? (metric.completedJobs / metric.totalJobs) * 100
              : 0;

          if (metric.durations.length > 0) {
            const sorted = [...metric.durations].sort((a, b) => a - b);
            metric.avgDuration =
              sorted.reduce((a, b) => a + b, 0) / sorted.length;
            metric.p95Duration = sorted[Math.floor(sorted.length * 0.95)] || 0;
            metric.p99Duration = sorted[Math.floor(sorted.length * 0.99)] || 0;
          }

          return metric;
        });

        // Calculate throughput by queue
        const queueThroughput = new Map<string, number>();
        const allJobs = [...completedJobs, ...failedJobs];
        for (const job of allJobs) {
          const count = queueThroughput.get(job.queueName) || 0;
          queueThroughput.set(job.queueName, count + 1);
        }

        const throughput = Array.from(queueThroughput.entries()).map(
          ([queueName, count]) => ({
            queueName,
            jobsPerHour: count / input.hours,
            totalJobs: count,
          }),
        );

        // Top slowest jobs (by p95 duration)
        const topSlowest = [...metrics]
          .filter((m) => m.p95Duration > 0)
          .sort((a, b) => b.p95Duration - a.p95Duration)
          .slice(0, 10)
          .map((m) => ({
            name: m.name,
            p95Duration: m.p95Duration,
            avgDuration: m.avgDuration,
          }));

        // Top failing jobs
        const topFailing = [...metrics]
          .filter((m) => m.failedJobs > 0)
          .sort((a, b) => b.failedJobs - a.failedJobs)
          .slice(0, 10)
          .map((m) => ({
            name: m.name,
            failedJobs: m.failedJobs,
            successRate: m.successRate,
          }));

        return {
          jobMetrics: metrics,
          throughput,
          topSlowest,
          topFailing,
          timeWindowHours: input.hours,
        };
      } catch (error) {
        console.error("[jobs.analytics] Error fetching analytics:", error);
        return {
          jobMetrics: [],
          throughput: [],
          topSlowest: [],
          topFailing: [],
          timeWindowHours: input.hours,
        };
      }
    }),
});
