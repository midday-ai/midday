import type { StaticSchedulerConfig } from "../types/scheduler-config";

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
  {
    name: "inbox-sync-accounts",
    queue: "inbox-provider",
    cron: "0 */6 * * *", // Every 6 hours
    jobName: "sync-accounts-scheduler",
    payload: {},
    options: {
      tz: "UTC",
    },
  },
];
