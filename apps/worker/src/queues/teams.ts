import { Queue } from "bullmq";
import { teamsQueueConfig } from "./teams.config";

/**
 * Teams queue instance
 * Used for enqueueing team lifecycle jobs (deletion, cleanup)
 * Configuration is defined in teams.config.ts
 */
export const teamsQueue = new Queue("teams", teamsQueueConfig.queueOptions);
