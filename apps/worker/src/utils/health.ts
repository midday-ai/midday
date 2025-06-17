import type { Queue } from "bullmq";

export async function checkQueueHealth(queue: Queue) {
  const jobCounts = await queue.getJobCounts();

  return jobCounts;
}
