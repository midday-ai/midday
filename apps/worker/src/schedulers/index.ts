import type {
  DynamicSchedulerTemplate,
  StaticSchedulerConfig,
} from "../types/scheduler-config";
import { inboxStaticSchedulers } from "./inbox.config";
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
 * Currently empty -- inbox syncs moved to centralized static scheduler
 */
export const dynamicSchedulerTemplates: DynamicSchedulerTemplate[] = [];
