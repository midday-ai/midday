import type { Queue } from "bullmq";
import Redis from "ioredis";
import type { AdminConfig } from "./config";
import { setAdminConfig } from "./config";
import { initializeQueuesFromNames, registerQueues } from "./queues";

export async function startAdmin(config?: Partial<AdminConfig>) {
  const redisUrl = process.env.REDIS_QUEUE_URL;

  if (!redisUrl && !config?.redis) {
    throw new Error(
      `REDIS_QUEUE_URL environment variable or redis config is required. Current value: ${redisUrl === undefined ? "undefined" : `"${redisUrl}"`}`,
    );
  }

  if (redisUrl && !redisUrl.startsWith("redis://")) {
    throw new Error(
      `Invalid REDIS_QUEUE_URL format. Expected redis:// URL, got: "${redisUrl}"`,
    );
  }

  const redisConfig = config?.redis || (redisUrl ? redisUrl : undefined);

  // Default queue names if not provided
  const queueNames = config?.queues?.length
    ? config.queues
    : ["transactions", "inbox", "inbox-provider", "documents", "notifications"];

  const adminConfig: AdminConfig = {
    redis: redisConfig as any,
    queues: queueNames,
    ...config,
  };

  setAdminConfig(adminConfig);

  // Register queues
  if (adminConfig.queues.length > 0) {
    const firstQueue = adminConfig.queues[0];
    if (typeof firstQueue === "string") {
      // Queue names provided - discover from Redis
      await initializeQueuesFromNames(
        adminConfig.queues as string[],
        redisConfig,
      );
    } else {
      // Queue instances provided
      registerQueues(adminConfig.queues as Queue[]);
    }
  }

  const queuesCount = adminConfig.queues.length;
  console.log(
    `Queue Board initialized with ${queuesCount} queues: ${(adminConfig.queues as string[]).join(", ")}`,
  );

  // Log Redis URL (masked for security)
  if (redisUrl) {
    const maskedUrl = redisUrl.replace(/:[^:@]+@/, ":****@");
    console.log(`[Queue Board] Using Redis URL: ${maskedUrl}`);
  }
}
