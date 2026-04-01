import type { StaticSchedulerConfig } from "../types/scheduler-config";

export const notificationsStaticSchedulers: StaticSchedulerConfig[] = [
  {
    name: "activity-notification-flush",
    queue: "notifications",
    cron: "*/1 * * * *",
    jobName: "activity-notification-flush",
    payload: {},
    options: {
      tz: "UTC",
    },
  },
];
