import { z } from "zod";

/**
 * Rates job schemas
 */

export const ratesSchedulerSchema = z.object({
  // Empty payload - scheduler runs globally
});

export type RatesSchedulerPayload = z.infer<typeof ratesSchedulerSchema>;
