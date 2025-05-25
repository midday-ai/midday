import { z } from "zod";
import "zod-openapi/extend";

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(32).optional().openapi({
    description: "The user's full name. Minimum 2, maximum 32 characters.",
  }),
  teamId: z.string().optional().openapi({
    description: "The ID of the team the user belongs to.",
  }),
  email: z.string().email().optional().openapi({
    description: "The user's email address.",
  }),
  avatarUrl: z.string().url().optional().openapi({
    description: "URL to the user's avatar image.",
  }),
  locale: z.string().optional().openapi({
    description: "The user's locale (e.g., en-US, fr-FR).",
  }),
  weekStartsOnMonday: z.boolean().optional().openapi({
    description: "Whether the user's week starts on Monday.",
  }),
  timezone: z.string().optional().openapi({
    description: "The user's timezone (e.g., 'America/New_York').",
  }),
  timeFormat: z.number().optional().openapi({
    description: "The user's preferred time format (e.g., 12 or 24).",
  }),
  dateFormat: z
    .enum(["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "dd.MM.yyyy"])
    .optional()
    .openapi({
      description:
        "The user's preferred date format. One of: 'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'dd.MM.yyyy'.",
    }),
});

export const userSchema = z.object({
  id: z.string().uuid().openapi({
    description: "The user's ID.",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  fullName: z.string().openapi({
    description: "The user's full name.",
    example: "Jane Doe",
  }),
  email: z.string().email().openapi({
    description: "The user's email address.",
    example: "jane.doe@example.com",
  }),
  avatarUrl: z.string().url().nullable().openapi({
    description: "URL to the user's avatar image.",
    example: "https://cdn.midday.ai/avatar.jpg",
  }),
  locale: z.string().nullable().openapi({
    description: "The user's locale (e.g., en-US, fr-FR).",
    example: "en-US",
  }),
  weekStartsOnMonday: z.boolean().nullable().openapi({
    description: "Whether the user's week starts on Monday.",
    example: true,
  }),
  timezone: z.string().nullable().openapi({
    description: "The user's timezone (e.g., 'America/New_York').",
    example: "America/New_York",
  }),
  timeFormat: z.number().nullable().openapi({
    description: "The user's preferred time format (e.g., 12 or 24).",
    example: 24,
  }),
  dateFormat: z
    .enum(["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "dd.MM.yyyy"])
    .nullable()
    .openapi({
      description:
        "The user's preferred date format. One of: 'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'dd.MM.yyyy'.",
      example: "yyyy-MM-dd",
    }),
  team: z
    .object({
      id: z.string().uuid().openapi({
        description: "The team's ID.",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
      name: z.string().openapi({
        description: "The team's name.",
        example: "Acme Corp",
      }),
      logoUrl: z.string().url().openapi({
        description: "The team's logo URL.",
        example: "https://cdn.midday.ai/logo.png",
      }),
      plan: z.string().openapi({
        description: "The team's subscription plan.",
        example: "pro",
      }),
    })
    .nullable(),
});
