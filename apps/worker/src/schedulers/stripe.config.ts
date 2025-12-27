import type { DynamicSchedulerTemplate } from "../types/scheduler-config";
import { generateBiHourlyCronTag } from "../utils/generate-cron-tag";

/**
 * Dynamic scheduler templates for Stripe
 * These are registered per-account when Stripe accounts are connected
 */
export const stripeDynamicSchedulerTemplates: DynamicSchedulerTemplate[] = [
  {
    template: "stripe-sync-scheduler",
    queue: "stripe",
    cronGenerator: (appId: string) => generateBiHourlyCronTag(appId),
    jobName: "sync-stripe",
    payloadGenerator: (appId: string) => ({
      appId,
      manualSync: false,
    }),
    jobKey: (appId: string) => `stripe-sync-${appId}`,
    options: {
      tz: "UTC",
    },
  },
];
