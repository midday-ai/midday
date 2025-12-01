import type {
  DynamicSchedulerTemplate,
  StaticSchedulerConfig,
} from "../types/scheduler-config";
import {
  inboxDynamicSchedulerTemplates,
  inboxStaticSchedulers,
} from "./inbox.config";

/**
 * All static scheduler configurations
 * Add new static scheduler configs here to automatically register them
 */
export const staticSchedulerConfigs: StaticSchedulerConfig[] = [
  ...inboxStaticSchedulers,
];

/**
 * All dynamic scheduler templates
 * Add new dynamic scheduler templates here
 */
export const dynamicSchedulerTemplates: DynamicSchedulerTemplate[] = [
  ...inboxDynamicSchedulerTemplates,
];
