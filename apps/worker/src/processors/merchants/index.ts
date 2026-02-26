import { EnrichMerchantProcessor } from "./enrich-merchant";

/**
 * Export all merchant processors (for type imports)
 */
export { EnrichMerchantProcessor } from "./enrich-merchant";

/**
 * Merchant processor registry
 * Maps job names to processor instances
 */
export const merchantProcessors = {
  "enrich-merchant": new EnrichMerchantProcessor(),
};
