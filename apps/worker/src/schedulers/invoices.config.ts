import type { StaticSchedulerConfig } from "../types/scheduler-config";

/**
 * Static scheduler configurations for invoices
 * These run on fixed schedules and are registered on startup
 */
export const invoicesStaticSchedulers: StaticSchedulerConfig[] = [
  {
    name: "invoice-recurring-scheduler",
    queue: "invoices",
    cron: "0 * * * *", // Every hour at :00
    jobName: "invoice-recurring-scheduler",
    payload: {},
    options: {
      tz: "UTC",
    },
  },
  {
    name: "invoice-upcoming-notification",
    queue: "invoices",
    cron: "30 * * * *", // Every hour at :30 (offset from recurring scheduler)
    jobName: "invoice-upcoming-notification",
    payload: {},
    options: {
      tz: "UTC",
    },
  },
];
