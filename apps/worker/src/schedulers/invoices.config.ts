import type { StaticSchedulerConfig } from "../types/scheduler-config";

/**
 * Static scheduler configurations for invoices
 * These run on fixed schedules and are registered on startup
 */
export const invoicesStaticSchedulers: StaticSchedulerConfig[] = [
  {
    name: "invoice-recurring-scheduler",
    queue: "invoices",
    cron: "0 */2 * * *", // Every 2 hours (0:00, 2:00, 4:00, ..., 22:00 UTC)
    jobName: "invoice-recurring-scheduler",
    payload: {},
    options: {
      tz: "UTC",
    },
  },
  {
    name: "invoice-upcoming-notification",
    queue: "invoices",
    // Run every 2 hours, offset by 1 hour from the recurring scheduler
    // This ensures notifications go out before invoices are generated
    cron: "0 1,3,5,7,9,11,13,15,17,19,21,23 * * *", // Odd hours UTC
    jobName: "invoice-upcoming-notification",
    payload: {},
    options: {
      tz: "UTC",
    },
  },
];
