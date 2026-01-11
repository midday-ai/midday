import type { StaticSchedulerConfig } from "../types/scheduler-config";

/**
 * Static scheduler configurations for insights
 * These run on fixed schedules and are registered on startup
 *
 * Strategy: Each dispatcher runs hourly on the appropriate day to catch
 * teams in different timezones at their local 7 AM.
 *
 * MVP: Only weekly is enabled. Monthly/quarterly/yearly are ready to activate.
 */
export const insightsStaticSchedulers: StaticSchedulerConfig[] = [
  {
    name: "insights-weekly-dispatcher",
    queue: "insights",
    cron: "0 * * * 1", // Every hour on Monday
    jobName: "dispatch-insights",
    payload: { periodType: "weekly" },
    options: {
      tz: "UTC",
    },
  },
  // Future: Monthly insights (first of month)
  // {
  //   name: "insights-monthly-dispatcher",
  //   queue: "insights",
  //   cron: "0 * 1 * *", // Every hour on 1st of month
  //   jobName: "dispatch-insights",
  //   payload: { periodType: "monthly" },
  //   options: {
  //     tz: "UTC",
  //   },
  // },
  // Future: Quarterly insights (first of Jan/Apr/Jul/Oct)
  // {
  //   name: "insights-quarterly-dispatcher",
  //   queue: "insights",
  //   cron: "0 * 1 1,4,7,10 *",
  //   jobName: "dispatch-insights",
  //   payload: { periodType: "quarterly" },
  //   options: {
  //     tz: "UTC",
  //   },
  // },
  // Future: Yearly insights (Jan 1st)
  // {
  //   name: "insights-yearly-dispatcher",
  //   queue: "insights",
  //   cron: "0 * 1 1 *",
  //   jobName: "dispatch-insights",
  //   payload: { periodType: "yearly" },
  //   options: {
  //     tz: "UTC",
  //   },
  // },
];
