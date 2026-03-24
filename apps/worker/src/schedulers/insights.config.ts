import type { StaticSchedulerConfig } from "../types/scheduler-config";

/**
 * Static scheduler configurations for insights
 *
 * Strategy:
 * - Runs every 30 min on Monday, generates for teams where it's 7 AM local
 * - 48 runs on Monday = 2 chances per timezone band
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
    payload: { periodType: "weekly" },
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
