import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";
import {
  getAllQueueMetrics,
  getQueue,
  getQueueMetrics,
} from "@/lib/queues";

export const queuesRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    try {
      const metrics = await getAllQueueMetrics();
      return metrics;
    } catch (error) {
      console.error("[queues.list] Error fetching queue metrics:", error);
      // Return empty array if queues aren't initialized yet
      return [];
    }
  }),

  get: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ input }) => {
      const queue = getQueue(input.name);

      if (!queue) {
        throw new Error(`Queue "${input.name}" not found`);
      }

      const metrics = await getQueueMetrics(queue);
      return {
        name: queue.name,
        metrics,
      };
    }),

  pause: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input }) => {
      const queue = getQueue(input.name);

      if (!queue) {
        throw new Error(`Queue "${input.name}" not found`);
      }

      await queue.pause();
      return { success: true, message: "Queue paused" };
    }),

  resume: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input }) => {
      const queue = getQueue(input.name);

      if (!queue) {
        throw new Error(`Queue "${input.name}" not found`);
      }

      await queue.resume();
      return { success: true, message: "Queue resumed" };
    }),

  clean: publicProcedure
    .input(
      z.object({
        name: z.string(),
        status: z.enum(["completed", "wait", "active", "delayed", "failed"]).optional(),
        grace: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const queue = getQueue(input.name);

      if (!queue) {
        throw new Error(`Queue "${input.name}" not found`);
      }

      await queue.clean(input.grace || 0, 100, input.status || "completed");
      return { success: true, message: "Queue cleaned" };
    }),
});

