import type { StaticSchedulerConfig } from "../types/scheduler-config";

/**
 * Static scheduler configurations for deals
 * These run on fixed schedules and are registered on startup
 */
export const dealsStaticSchedulers: StaticSchedulerConfig[] = [
  {
    name: "deal-recurring-scheduler",
    queue: "deals",
    cron: "0 * * * *", // Every hour at :00
    jobName: "deal-recurring-scheduler",
    payload: {},
    options: {
      tz: "UTC",
    },
  },
  {
    name: "deal-upcoming-notification",
    queue: "deals",
    cron: "30 * * * *", // Every hour at :30 (offset from recurring scheduler)
    jobName: "deal-upcoming-notification",
    payload: {},
    options: {
      tz: "UTC",
    },
  },
];
