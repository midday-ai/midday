import type { StaticSchedulerConfig } from "../types/scheduler-config";

/**
 * Static scheduler configurations for collections
 * Three daily crons: auto-escalation, SLA breach check, follow-up reminders
 */
export const collectionsStaticSchedulers: StaticSchedulerConfig[] = [
  {
    name: "collections-auto-escalate",
    queue: "collections",
    cron: "0 2 * * *", // Daily at 2:00 AM UTC
    jobName: "collections-auto-escalate",
    payload: {},
    options: {
      tz: "UTC",
    },
  },
  {
    name: "collections-sla-check",
    queue: "collections",
    cron: "0 3 * * *", // Daily at 3:00 AM UTC
    jobName: "collections-sla-check",
    payload: {},
    options: {
      tz: "UTC",
    },
  },
  {
    name: "collections-follow-up-reminders",
    queue: "collections",
    cron: "0 8 * * *", // Daily at 8:00 AM UTC (start of business)
    jobName: "collections-follow-up-reminders",
    payload: {},
    options: {
      tz: "UTC",
    },
  },
];
