import { Queue } from "bullmq";
import { stripeQueueConfig } from "./stripe.config";

/**
 * Stripe queue instance
 * Used for enqueueing Stripe sync jobs
 * Configuration is defined in stripe.config.ts
 */
export const stripeQueue = new Queue("stripe", stripeQueueConfig.queueOptions);
