import { z } from "@hono/zod-openapi";

export const teamResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Unique identifier of the team",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  name: z.string().openapi({
    description: "Name of the team or organization",
    example: "Acme Corporation",
  }),
  logoUrl: z.string().url().nullable().openapi({
    description: "URL to the team's logo image",
    example: "https://cdn.midday.ai/logos/acme-corp.png",
  }),
  plan: z.enum(["trial", "starter", "pro"]).openapi({
    description: "Current subscription plan of the team",
    example: "pro",
  }),
  // subscriptionStatus: z
  //   .enum([
  //     "active",
  //     "canceled",
  //     "past_due",
  //     "unpaid",
  //     "trialing",
  //     "incomplete",
  //     "incomplete_expired",
  //   ])
  //   .nullable()
  //   .openapi({
  //     description: "Current subscription status of the team",
  //     example: "active",
  //   }),
});

export const teamsResponseSchema = z.object({
  data: z.array(teamResponseSchema).openapi({
    description: "Array of teams that the user has access to",
  }),
});

export const getTeamByIdSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({
      description: "Unique identifier of the team",
      example: "123e4567-e89b-12d3-a456-426614174000",
      param: {
        in: "path",
        name: "id",
        required: true,
      },
    })
    .openapi({
      description: "Unique identifier of the team",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
});

export const updateTeamByIdSchema = z.object({
  name: z.string().min(2).max(32).optional().openapi({
    description:
      "Name of the team or organization. Must be between 2 and 32 characters",
    example: "Acme Corporation",
  }),
  email: z.string().email().optional().openapi({
    description: "Primary contact email address for the team",
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
        "URL to the team's logo image. Must be hosted on midday.ai domain",
      example: "https://cdn.midday.ai/logos/acme-corp.png",
    }),
  baseCurrency: z.string().optional().openapi({
    description:
      "Base currency for the team in ISO 4217 format (3-letter currency code)",
    example: "USD",
  }),
  countryCode: z.string().optional().openapi({
    description: "Country code for the team",
    example: "US",
  }),
});

export const createTeamSchema = z.object({
  name: z.string().openapi({
    description: "Name of the team or organization",
    example: "Acme Corporation",
  }),
  baseCurrency: z.string().openapi({
    description:
      "Base currency for the team in ISO 4217 format (3-letter currency code)",
    example: "USD",
  }),
  countryCode: z.string().optional().openapi({
    description: "Country code for the team",
    example: "US",
  }),
  logoUrl: z.string().url().optional().openapi({
    description: "URL to the team's logo image",
    example: "https://cdn.midday.ai/logos/acme-corp.png",
  }),
});

export const leaveTeamSchema = z.object({
  teamId: z.string().openapi({
    description: "Unique identifier of the team to leave",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const acceptTeamInviteSchema = z.object({
  id: z.string().openapi({
    description: "Unique identifier of the team invitation to accept",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const declineTeamInviteSchema = z.object({
  id: z.string().openapi({
    description: "Unique identifier of the team invitation to decline",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const deleteTeamSchema = z.object({
  teamId: z.string().openapi({
    description: "Unique identifier of the team to delete",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const deleteTeamMemberSchema = z.object({
  teamId: z.string().openapi({
    description: "Unique identifier of the team",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  userId: z.string().openapi({
    description: "Unique identifier of the user to remove from the team",
    example: "456e7890-f12a-34b5-c678-901234567890",
  }),
});

export const updateTeamMemberSchema = z.object({
  teamId: z.string().openapi({
    description: "Unique identifier of the team",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  userId: z.string().openapi({
    description: "Unique identifier of the user whose role to update",
    example: "456e7890-f12a-34b5-c678-901234567890",
  }),
  role: z.enum(["owner", "member"]).openapi({
    description:
      "New role for the team member. 'owner' has full permissions, 'member' has limited permissions",
    example: "member",
  }),
});

export const inviteTeamMembersSchema = z
  .array(
    z.object({
      email: z.string().openapi({
        description: "Email address of the person to invite",
        example: "john.doe@acme.com",
      }),
      role: z.enum(["owner", "member"]).openapi({
        description:
          "Role to assign to the invited member. 'owner' has full permissions, 'member' has limited permissions",
        example: "member",
      }),
    }),
  )
  .openapi({
    description: "Array of team member invitations to send",
    example: [
      { email: "john.doe@acme.com", role: "member" },
      { email: "jane.smith@acme.com", role: "owner" },
    ],
  });

export const deleteTeamInviteSchema = z.object({
  id: z.string().openapi({
    description: "Unique identifier of the team invitation to delete",
    example: "invite-123abc456def",
  }),
});

export const updateBaseCurrencySchema = z.object({
  baseCurrency: z.string().openapi({
    description:
      "New base currency for the team in ISO 4217 format (3-letter currency code)",
    example: "EUR",
  }),
});

export const teamMemberResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Unique identifier of the user",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  role: z.enum(["owner", "member"]).openapi({
    description:
      "Role of the team member. 'owner' has full permissions, 'member' has limited permissions",
    example: "owner",
  }),
  fullName: z.string().openapi({
    description: "Full name of the team member",
    example: "John Doe",
  }),
  avatarUrl: z.string().url().nullable().openapi({
    description: "URL to the team member's avatar image",
    example: "https://cdn.midday.ai/avatars/john-doe.png",
  }),
});

export const teamMembersResponseSchema = z.object({
  data: z.array(teamMemberResponseSchema).openapi({
    description: "Array of team members with their roles and information",
  }),
});
