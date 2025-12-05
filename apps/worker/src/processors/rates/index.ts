import { RatesSchedulerProcessor } from "./rates-scheduler";

/**
 * Export all rates processors (for type imports)
 */
export { RatesSchedulerProcessor } from "./rates-scheduler";

/**
 * Rates processor registry
 * Maps job names to processor instances
 */
export const ratesProcessors = {
  "rates-scheduler": new RatesSchedulerProcessor(),
};
