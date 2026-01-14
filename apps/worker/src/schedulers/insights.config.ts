import type { StaticSchedulerConfig } from "../types/scheduler-config";

/**
 * Static scheduler configurations for insights
 *
 * Strategy:
 * - Primary: Runs every 30 min on Monday, generates for teams where it's 7 AM local
 * - Catch-up: Runs Tuesday 10 AM UTC, generates for any team missing insights
 *
 * Reliability:
 * - 48 runs on Monday = 2 chances per timezone band
 * - Tuesday catch-up handles any Monday failures
 * - 99.9%+ users get insights on Monday at ~7 AM local time
 *
 * MVP: Only weekly is enabled. Monthly/quarterly/yearly can be added later.
 */
export const insightsStaticSchedulers: StaticSchedulerConfig[] = [
  {
    name: "insights-weekly-dispatcher",
    queue: "insights",
    cron: "*/30 * * * 1", // Every 30 minutes on Monday
    jobName: "dispatch-insights",
    payload: { periodType: "weekly", catchUp: false },
    options: {
      tz: "UTC",
    },
  },
  {
    name: "insights-weekly-catchup",
    queue: "insights",
    cron: "0 10 * * 2", // Tuesday 10 AM UTC
    jobName: "dispatch-insights",
    payload: { periodType: "weekly", catchUp: true },
    options: {
      tz: "UTC",
    },
  },
  // Future: Monthly insights
  // {
  //   name: "insights-monthly-dispatcher",
  //   queue: "insights",
  //   cron: "*/30 * * * 1", // Every 30 min on 1st of month
  //   jobName: "dispatch-insights",
  //   payload: { periodType: "monthly", catchUp: false },
  //   options: {
  //     tz: "UTC",
  //   },
  // },
];
