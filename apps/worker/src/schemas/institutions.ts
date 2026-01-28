import { z } from "zod";

/**
 * Payload for the institutions sync scheduler job
 */
export const institutionsSyncSchedulerSchema = z.object({
  // No payload needed for scheduled sync
});

export type InstitutionsSyncSchedulerPayload = z.infer<
  typeof institutionsSyncSchedulerSchema
>;

/**
 * Result of the institutions sync job
 */
export type InstitutionsSyncResult = {
  added: number;
  updated: number;
  disabled: number;
  errors: number;
  providers: {
    plaid: { added: number; updated: number; errors: number };
    gocardless: { added: number; updated: number; errors: number };
    teller: { added: number; updated: number; errors: number };
    enablebanking: { added: number; updated: number; errors: number };
  };
};
