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
          status: "completed" | "failed";
        }> = [];

        // Get recent completed and failed jobs from all queues
        for (const queue of allQueues) {
          try {
            const [completed, failed] = await Promise.all([
              queue.getCompleted(0, input.limit - 1),
              queue.getFailed(0, input.limit - 1),
            ]);

            for (const job of completed) {
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
              });
            }

            for (const job of failed) {
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
              });
            }
          } catch (error) {
            console.error(
              `Error fetching recent jobs from queue ${queue.name}:`,
              error,
            );
          }
        }

        // Sort by finishedOn or timestamp (most recent first)
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
});
