import { z } from "@hono/zod-openapi";
import { isValidTimezone } from "@midday/location/timezones";

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(32).optional().openapi({
    description: "Full name of the user. Must be between 2 and 32 characters",
    example: "Jane Doe",
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
  timezone: z
    .string()
    .refine(isValidTimezone, {
      message:
        "Invalid timezone. Use IANA timezone format (e.g., 'America/New_York', 'UTC')",
    })
    .optional()
    .openapi({
      description:
        "User's timezone identifier in IANA Time Zone Database format",
      example: "America/New_York",
    }),
  timezoneAutoSync: z.boolean().optional().openapi({
    description: "Whether to automatically sync timezone with browser timezone",
    example: true,
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
        "ddSlashMMSlashyyyy",
        "MMSlashddSlashyyyy",
        "yyyyDashMMDashdd",
        "ddDotMMDotyyyy",
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
  timezoneAutoSync: z.boolean().nullable().openapi({
    description: "Whether to automatically sync timezone with browser timezone",
    example: true,
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
        "ddSlashMMSlashyyyy",
        "MMSlashddSlashyyyy",
        "yyyyDashMMDashdd",
        "ddDotMMDotyyyy",
      ],
    }),
  fileKey: z.string().nullable().openapi({
    description:
      "Team file key (JWT token) for proxy/download access to team files. This compact JWT token contains the team ID and is shared by all team members. Use this token as the `fk` query parameter when accessing file endpoints (proxy, download). The token is team-scoped and provides access to files belonging to the user's team. Returns null if the user has no team.",
    example:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZWFtSWQiOiIxMjM0NTY3OC05YWJjLWRlZmctMTIzNC01Njc4OTBhYmNkZWYifQ.signature",
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
