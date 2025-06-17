import type { Queue } from "bullmq";
import { getAllQueues } from "../queues";

export async function checkQueueHealth() {
  const queues = getAllQueues();
  const healthChecks = await Promise.all(
    queues.map(async (queue) => {
      const jobCounts = await queue.getJobCounts();
      return {
        queueName: queue.name,
        jobCounts,
      };
    }),
  );

  return healthChecks;
}
