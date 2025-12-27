import { SyncStripeProcessor } from "./sync-stripe";

/**
 * Export all stripe processors (for type imports)
 */
export { SyncStripeProcessor } from "./sync-stripe";

/**
 * Stripe processor registry
 * Maps job names to processor instances
 */
export const stripeProcessors = {
  "sync-stripe": new SyncStripeProcessor(),
};
