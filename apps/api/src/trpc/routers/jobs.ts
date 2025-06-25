import {
  createTRPCRouter,
  internalProcedure,
  protectedProcedure,
} from "@api/trpc/init";
import { tasks } from "@worker/jobs/tasks";
import { createBaseQueueOptions } from "@worker/queues/base";
import { onboardTeamSchema } from "@worker/schemas/jobs";
import { Queue } from "bullmq";
import { z } from "zod";

export const jobsRouter = createTRPCRouter({
  onboardTeam: internalProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
      }),
    )
    .mutation(async ({ input }) => {
      const { userId } = input;

      try {
        return tasks.trigger(
          onboardTeamSchema,
          "onboarding",
          "onboard-team",
          { userId },
          { delay: 5 * 60 * 1000 }, // 5 minutes
        );
      } catch (error) {
        console.error("Failed to trigger system onboarding job:", error);
        throw new Error("Failed to schedule onboarding job");
      }
    }),

  getStatus: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        queue: z.string(),
      }),
    )
    .query(async ({ input, ctx: { teamId } }) => {
      const { jobId, queue: queueName } = input;

      let jobData = null;
      let queue: Queue | null = null;

      try {
        // Create queue instance using base configuration
        queue = new Queue(queueName, createBaseQueueOptions());

        const foundJob = await queue.getJob(jobId);
        if (foundJob) {
          // Security check: ensure job belongs to the user's team
          if (foundJob.data.teamId !== teamId) {
            throw new Error("Job not found");
          }

          // Extract all data we need BEFORE closing the connection
          const progress = foundJob.progress;
          const state = await foundJob.getState();

          let status: "waiting" | "active" | "completed" | "failed";
          switch (state) {
            case "waiting":
            case "delayed":
              status = "waiting";
              break;
            case "active":
              status = "active";
              break;
            case "completed":
              status = "completed";
              break;
            case "failed":
              status = "failed";
              break;
            default:
              status = "waiting";
          }

          jobData = {
            jobId,
            jobName: foundJob.name,
            status,
            progress: typeof progress === "number" ? progress : 0,
            result: status === "completed" ? foundJob.returnvalue : null,
            error: status === "failed" ? foundJob.failedReason : null,
            timestamp: Date.now(),
          };
        }

        if (!jobData) {
          throw new Error("Job not found");
        }

        return jobData;
      } catch {
        throw new Error("Failed to get job status");
      } finally {
        // Ensure we close the queue connection
        if (queue) {
          await queue.close().catch(console.error);
        }
      }
    }),
});
