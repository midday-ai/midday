import { z } from "zod";
import "zod-openapi/extend";

export const teamResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  plan: z.enum(["trial", "starter", "pro"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const teamsResponseSchema = z.object({
  data: z.array(teamResponseSchema),
});

export const updateTeamByIdSchema = z.object({
  name: z.string().min(2).max(32).optional(),
  email: z.string().email().optional(),
  logoUrl: z.string().url().optional(),
  baseCurrency: z.string().optional(),
});

export const createTeamSchema = z.object({
  name: z.string(),
  baseCurrency: z.string(),
});

export const leaveTeamSchema = z.object({
  teamId: z.string(),
});

export const acceptTeamInviteSchema = z.object({
  teamId: z.string(),
});

export const declineTeamInviteSchema = z.object({
  teamId: z.string(),
});

export const deleteTeamSchema = z.object({
  teamId: z.string(),
});

export const deleteTeamMemberSchema = z.object({
  teamId: z.string(),
  userId: z.string(),
});

export const updateTeamMemberSchema = z.object({
  teamId: z.string(),
  userId: z.string(),
  role: z.enum(["owner", "member"]),
});

export const inviteTeamMembersSchema = z.array(
  z.object({
    email: z.string(),
    role: z.enum(["owner", "member"]),
  }),
);

export const deleteTeamInviteSchema = z.object({
  inviteId: z.string(),
});

export const updateBaseCurrencySchema = z.object({
  baseCurrency: z.string(),
});
