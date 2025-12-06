import type { StaticSchedulerConfig } from "../types/scheduler-config";

/**
 * Static scheduler configurations for rates
 * These run on fixed schedules and are registered on startup
 */
export const ratesStaticSchedulers: StaticSchedulerConfig[] = [
  {
    name: "rates-scheduler",
    queue: "rates",
    cron: "0 0,12 * * *", // Twice daily at 0:00 and 12:00 UTC
    jobName: "rates-scheduler",
    payload: {},
    options: {
      tz: "UTC",
    },
  },
];
