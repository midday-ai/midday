import type {
  DynamicSchedulerTemplate,
  StaticSchedulerConfig,
} from "../types/scheduler-config";
import { generateQuarterDailyCronTag } from "../utils/generate-cron-tag";

/**
 * Static scheduler configurations for inbox
 * These run on fixed schedules and are registered on startup
 */
export const inboxStaticSchedulers: StaticSchedulerConfig[] = [
  {
    name: "no-match-scheduler",
    queue: "inbox",
    cron: "0 2 * * *", // Daily at 2 AM UTC
    jobName: "no-match-scheduler",
    payload: {},
    options: {
      tz: "UTC",
    },
  },
];

/**
 * Dynamic scheduler templates for inbox
 * These are registered per-account when accounts are connected
 */
export const inboxDynamicSchedulerTemplates: DynamicSchedulerTemplate[] = [
  {
    template: "inbox-sync-scheduler",
    queue: "inbox-provider",
    cronGenerator: (accountId: string) =>
      generateQuarterDailyCronTag(accountId),
    jobName: "sync-scheduler",
    payloadGenerator: (accountId: string) => ({
      id: accountId,
      manualSync: false,
    }),
    jobKey: (accountId: string) => `inbox-sync-${accountId}`,
    options: {
      tz: "UTC",
    },
  },
];
