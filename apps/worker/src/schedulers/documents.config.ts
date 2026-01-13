import type { StaticSchedulerConfig } from "../types/scheduler-config";

/**
 * Static scheduler configurations for documents
 * These run on fixed schedules and are registered on startup
 */
export const documentsStaticSchedulers: StaticSchedulerConfig[] = [
  // TODO: Temporarily disabled - re-enable when ready
  // {
  //   name: "cleanup-stale-documents",
  //   queue: "documents",
  //   cron: "*/5 * * * *", // Every 5 minutes
  //   jobName: "cleanup-stale-documents",
  //   payload: {},
  //   options: {
  //     tz: "UTC",
  //   },
  // },
];
