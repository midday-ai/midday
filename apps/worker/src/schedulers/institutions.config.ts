import type { StaticSchedulerConfig } from "../types/scheduler-config";

/**
 * Static scheduler configurations for institutions
 * Runs daily to sync institutions from all banking providers
 */
export const institutionsStaticSchedulers: StaticSchedulerConfig[] = [
  {
    name: "sync-institutions",
    queue: "institutions",
    cron: "0 3 * * *", // Daily at 3:00 AM UTC
    jobName: "sync-institutions",
    payload: {},
    options: {
      tz: "UTC",
    },
  },
];
