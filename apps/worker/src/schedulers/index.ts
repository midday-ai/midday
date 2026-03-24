import type {
  DynamicSchedulerTemplate,
  StaticSchedulerConfig,
} from "../types/scheduler-config";
import {
  inboxDynamicSchedulerTemplates,
  inboxStaticSchedulers,
} from "./inbox.config";
import { insightsStaticSchedulers } from "./insights.config";
import { institutionsStaticSchedulers } from "./institutions.config";
import { invoicesStaticSchedulers } from "./invoices.config";
import { ratesStaticSchedulers } from "./rates.config";

/**
 * All static scheduler configurations
 * Add new static scheduler configs here to automatically register them
 */
export const staticSchedulerConfigs: StaticSchedulerConfig[] = [
  ...inboxStaticSchedulers,
  ...institutionsStaticSchedulers,
  ...invoicesStaticSchedulers,
  ...ratesStaticSchedulers,
  ...insightsStaticSchedulers,
];

/**
 * All dynamic scheduler templates
 * Add new dynamic scheduler templates here
 * Note: Accounting auto-sync has been removed in favor of manual export only
 */
export const dynamicSchedulerTemplates: DynamicSchedulerTemplate[] = [
  ...inboxDynamicSchedulerTemplates,
];
