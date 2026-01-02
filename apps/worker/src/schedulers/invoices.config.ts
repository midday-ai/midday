import type { StaticSchedulerConfig } from "../types/scheduler-config";

/**
 * Static scheduler configurations for invoices
 * These run on fixed schedules and are registered on startup
 */
export const invoicesStaticSchedulers: StaticSchedulerConfig[] = [
  {
    name: "invoice-recurring-scheduler",
    queue: "invoices",
    cron: "0 0,6,12,18 * * *", // Every 6 hours at 0:00, 6:00, 12:00, 18:00 UTC
    jobName: "invoice-recurring-scheduler",
    payload: {},
    options: {
      tz: "UTC",
    },
  },
];
