import { z } from "zod";

/**
 * Team job schemas
 */

const bankConnectionSchema = z.object({
  referenceId: z.string().nullable(),
  provider: z.string(),
  accessToken: z.string().nullable(),
});

export const deleteTeamSchema = z.object({
  teamId: z.string().uuid(),
  connections: z.array(bankConnectionSchema),
});

export type DeleteTeamPayload = z.infer<typeof deleteTeamSchema>;
