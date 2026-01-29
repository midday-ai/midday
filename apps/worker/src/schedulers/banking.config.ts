import type { DynamicSchedulerTemplate } from "../types/scheduler-config";
import { generateCronTag } from "../utils/generate-cron-tag";

/**
 * Banking dynamic scheduler templates
 *
 * The bank-sync scheduler is created dynamically per-team when a bank connection
 * is first set up. It uses a randomized cron pattern based on the teamId to
 * distribute load throughout the day.
 */
export const bankingDynamicSchedulerTemplates: DynamicSchedulerTemplate[] = [
  {
    template: "bank-sync",
    queue: "banking",
    jobName: "bank-sync-scheduler",
    payloadGenerator: (teamId: string) => ({
      teamId,
    }),
    cronGenerator: (teamId: string) => generateCronTag(teamId),
    jobKey: (teamId: string) => `bank-sync-${teamId}`,
  },
];
