import { z } from "zod";

/**
 * Rates job schemas (independent from @midday/jobs)
 */

export const ratesSchedulerSchema = z.object({
  // Empty payload - scheduler runs globally
});

export type RatesSchedulerPayload = z.infer<typeof ratesSchedulerSchema>;
