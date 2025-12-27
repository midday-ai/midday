import { z } from "zod";

/**
 * Stripe job schemas
 */

export const syncStripeSchema = z.object({
  appId: z.string().uuid(), // The apps table ID for this Stripe connection
  teamId: z.string().uuid().optional(), // Optional - will be fetched from app record if not provided
  manualSync: z.boolean().optional().default(false),
});

export type SyncStripePayload = z.infer<typeof syncStripeSchema>;

export const initialSyncStripeSchema = z.object({
  appId: z.string().uuid(),
  teamId: z.string().uuid(),
  bankAccountId: z.string().uuid(), // The bank_account created for Stripe
});

export type InitialSyncStripePayload = z.infer<typeof initialSyncStripeSchema>;
