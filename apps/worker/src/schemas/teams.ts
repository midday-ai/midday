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

/**
 * Invite team members schema
 * Sends invitation emails to new team members
 */
export const inviteTeamMembersSchema = z.object({
  teamId: z.string().uuid(),
  ip: z.string(),
  locale: z.string(),
  invites: z.array(
    z.object({
      email: z.string().email(),
      invitedByName: z.string(),
      invitedByEmail: z.string().email(),
      teamName: z.string(),
    }),
  ),
});

export type InviteTeamMembersPayload = z.infer<typeof inviteTeamMembersSchema>;
