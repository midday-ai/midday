import { EnrichCustomerProcessor } from "./enrich-customer";

/**
 * Export all customer processors (for type imports)
 */
export { EnrichCustomerProcessor } from "./enrich-customer";

/**
 * Customer processor registry
 * Maps job names to processor instances
 */
export const customerProcessors = {
  "enrich-customer": new EnrichCustomerProcessor(),
};
