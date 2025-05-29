import { z } from "@hono/zod-openapi";

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(32).optional().openapi({
    description: "Full name of the user. Must be between 2 and 32 characters",
    example: "Jane Doe",
  }),
  teamId: z.string().optional().openapi({
    description: "Unique identifier of the team the user belongs to",
    example: "team-abc123",
  }),
  email: z.string().email().optional().openapi({
    description: "Email address of the user",
    example: "jane.doe@acme.com",
  }),
  avatarUrl: z
    .string()
    .url()
    .refine((url) => url.includes("midday.ai"), {
      message: "avatarUrl must be a midday.ai domain URL",
    })
    .optional()
    .openapi({
      description:
        "URL to the user's avatar image. Must be hosted on midday.ai domain",
      example: "https://cdn.midday.ai/avatars/jane-doe.jpg",
    }),
  locale: z.string().optional().openapi({
    description:
      "User's preferred locale for internationalization (language and region)",
    example: "en-US",
  }),
  weekStartsOnMonday: z.boolean().optional().openapi({
    description:
      "Whether the user's calendar week starts on Monday (true) or Sunday (false)",
    example: true,
  }),
  timezone: z.string().optional().openapi({
    description: "User's timezone identifier in IANA Time Zone Database format",
    example: "America/New_York",
  }),
  timeFormat: z.number().optional().openapi({
    description:
      "User's preferred time format: 12 for 12-hour format, 24 for 24-hour format",
    example: 24,
  }),
  dateFormat: z
    .enum(["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "dd.MM.yyyy"])
    .optional()
    .openapi({
      description:
        "User's preferred date format. Available options: 'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'dd.MM.yyyy'",
      example: "yyyy-MM-dd",
      "x-speakeasy-enums": [
        { value: "dd/MM/yyyy", name: "DdSlashMmSlashYyyy" },
        { value: "MM/dd/yyyy", name: "MmSlashDdSlashYyyy" },
        { value: "yyyy-MM-dd", name: "YyyyDashMmDashDd" },
        { value: "dd.MM.yyyy", name: "DdDotMmDotYyyy" },
      ],
    }),
});

export const userSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Unique identifier of the user",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  fullName: z.string().openapi({
    description: "Full name of the user",
    example: "Jane Doe",
  }),
  email: z.string().email().openapi({
    description: "Email address of the user",
    example: "jane.doe@acme.com",
  }),
  avatarUrl: z.string().url().nullable().openapi({
    description: "URL to the user's avatar image",
    example: "https://cdn.midday.ai/avatars/jane-doe.jpg",
  }),
  locale: z.string().nullable().openapi({
    description:
      "User's preferred locale for internationalization (language and region)",
    example: "en-US",
  }),
  weekStartsOnMonday: z.boolean().nullable().openapi({
    description:
      "Whether the user's calendar week starts on Monday (true) or Sunday (false)",
    example: true,
  }),
  timezone: z.string().nullable().openapi({
    description: "User's timezone identifier in IANA Time Zone Database format",
    example: "America/New_York",
  }),
  timeFormat: z.number().nullable().openapi({
    description:
      "User's preferred time format: 12 for 12-hour format, 24 for 24-hour format",
    example: 24,
  }),
  dateFormat: z
    .enum(["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "dd.MM.yyyy"])
    .nullable()
    .openapi({
      description:
        "User's preferred date format. Available options: 'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'dd.MM.yyyy'",
      example: "yyyy-MM-dd",
      "x-speakeasy-enums": [
        { value: "dd/MM/yyyy", name: "DdSlashMmSlashYyyy" },
        { value: "MM/dd/yyyy", name: "MmSlashDdSlashYyyy" },
        { value: "yyyy-MM-dd", name: "YyyyDashMmDashDd" },
        { value: "dd.MM.yyyy", name: "DdDotMmDotYyyy" },
      ],
    }),
  team: z
    .object({
      id: z.string().uuid().openapi({
        description: "Unique identifier of the team",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
      name: z.string().openapi({
        description: "Name of the team or organization",
        example: "Acme Corporation",
      }),
      logoUrl: z.string().url().openapi({
        description: "URL to the team's logo image",
        example: "https://cdn.midday.ai/logos/acme-corp.png",
      }),
      plan: z.string().openapi({
        description: "Current subscription plan of the team",
        example: "pro",
      }),
    })
    .nullable()
    .openapi({
      description: "Team information that the user belongs to",
    }),
});
