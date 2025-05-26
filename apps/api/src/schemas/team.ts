import { z } from "@hono/zod-openapi";

export const teamResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: "The team's unique identifier.",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  name: z.string().openapi({
    description: "The team's name.",
    example: "Acme Corp",
  }),
  logoUrl: z.string().url().nullable().openapi({
    description: "URL to the team's logo image.",
    example: "https://cdn.midday.ai/logo.png",
  }),
  plan: z.enum(["trial", "starter", "pro"]).openapi({
    description: "The team's subscription plan.",
    example: "pro",
  }),
});

export const teamsResponseSchema = z.object({
  data: z.array(teamResponseSchema),
});

export const updateTeamByIdSchema = z.object({
  name: z.string().min(2).max(32).optional().openapi({
    description: "The team's name. Minimum 2, maximum 32 characters.",
    example: "Acme Corp",
  }),
  email: z.string().email().optional().openapi({
    description: "The team's contact email address.",
    example: "team@acme.com",
  }),
  logoUrl: z
    .string()
    .url()
    .refine((url) => url.includes("midday.ai"), {
      message: "logoUrl must be a midday.ai domain URL",
    })
    .optional()
    .openapi({
      description:
        "URL to the team's logo image. Must be a midday.ai domain URL.",
      example: "https://cdn.midday.ai/logo.png",
    }),
  baseCurrency: z.string().optional().openapi({
    description: "The team's base currency (ISO 4217 code).",
    example: "USD",
  }),
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

export const teamMemberResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: "The user's unique identifier.",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  role: z.enum(["owner", "member"]).openapi({
    description: "The team member's role.",
    example: "owner",
  }),
  fullName: z.string().openapi({
    description: "The user's full name.",
    example: "John Doe",
  }),
  avatarUrl: z.string().url().nullable().openapi({
    description: "URL to the user's avatar image.",
    example: "https://cdn.midday.ai/avatar.png",
  }),
});

export const teamMembersResponseSchema = z.object({
  data: z.array(teamMemberResponseSchema),
});
