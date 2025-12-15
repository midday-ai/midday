import type { DynamicSchedulerTemplate } from "../types/scheduler-config";
import { generateOffsetCronTag } from "../utils/generate-cron-tag";

/**
 * Dynamic scheduler templates for accounting
 * These are registered per-team when accounting providers are connected
 *
 * Uses generateOffsetCronTag with 6-hour offset to ensure:
 * 1. Accounting sync runs AFTER bank sync (bank sync uses generateCronTag)
 * 2. Load is spread across different times for different teams
 * 3. Bank transactions are available before pushing to accounting
 */
export const accountingDynamicSchedulerTemplates: DynamicSchedulerTemplate[] = [
  {
    template: "accounting-sync-scheduler",
    queue: "accounting",
    // Run 6 hours after bank sync to ensure transactions are available
    // Bank sync: generateCronTag(teamId) -> e.g., "45 14 * * *" (2:45 PM)
    // Accounting sync: generateOffsetCronTag(teamId, 6) -> "45 20 * * *" (8:45 PM)
    cronGenerator: (teamId: string) => generateOffsetCronTag(teamId, 6),
    jobName: "accounting-sync-scheduler",
    payloadGenerator: (teamId: string) => ({
      teamId,
      manualSync: false,
    }),
    jobKey: (teamId: string) => `accounting-sync-${teamId}`,
    options: {
      tz: "UTC",
    },
  },
];
