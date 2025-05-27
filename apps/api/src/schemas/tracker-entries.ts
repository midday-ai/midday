import { z } from "@hono/zod-openapi";

export const getTrackerRecordsByDateSchema = z.object({
  date: z.string().openapi({
    description: "Date for which to fetch tracker records (YYYY-MM-DD)",
    example: "2025-04-15",
  }),
});

export const getTrackerRecordsByRangeSchema = z.object({
  from: z.string().openapi({
    description: "Start date of the range (YYYY-MM-DD)",
    example: "2025-04-01",
  }),
  to: z.string().openapi({
    description: "End date of the range (YYYY-MM-DD)",
    example: "2025-04-30",
  }),
  projectId: z.string().uuid().optional().openapi({
    description: "Optional project ID to filter tracker entries",
    example: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
  }),
});

export const upsertTrackerEntriesSchema = z.object({
  id: z.string().uuid().optional().openapi({
    description: "Optional tracker entry ID (for update)",
    example: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
  }),
  start: z.string().datetime().openapi({
    description: "Start time (ISO 8601 format)",
    example: "2025-04-15T09:00:00Z",
  }),
  stop: z.string().datetime().openapi({
    description: "Stop time (ISO 8601 format)",
    example: "2025-04-15T17:00:00Z",
  }),
  dates: z
    .array(
      z.string().openapi({
        description: "Date for the entry (YYYY-MM-DD)",
        example: "2025-04-15",
      }),
    )
    .openapi({
      description: "Array of dates for which to create entries",
    }),
  assignedId: z.string().uuid().nullable().openapi({
    description: "User ID assigned to the entry",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  }),
  projectId: z.string().openapi({
    description: "Project ID for the tracker entry",
    example: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
  }),
  description: z.string().optional().nullable().openapi({
    description: "Optional description for the tracker entry",
    example: "Worked on feature X",
  }),
  duration: z.number().openapi({
    description: "Duration in seconds",
    example: 28800,
  }),
});

export const deleteTrackerEntrySchema = z.object({
  id: z.string().uuid().openapi({
    description: "ID of the tracker entry to delete",
    example: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
  }),
});

export const trackerEntryResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Tracker entry ID",
    example: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
  }),
  createdAt: z.string().openapi({
    description: "Creation timestamp (ISO 8601)",
    example: "2025-04-15T09:00:00Z",
  }),
  duration: z.number().openapi({
    description: "Duration in seconds",
    example: 28800,
  }),
  start: z.string().openapi({
    description: "Start time (ISO 8601 format)",
    example: "2025-04-15T09:00:00Z",
  }),
  stop: z.string().openapi({
    description: "Stop time (ISO 8601 format)",
    example: "2025-04-15T17:00:00Z",
  }),
  teamId: z.string().openapi({
    description: "Team ID",
    example: "team-1234",
  }),
  description: z.string().nullable().openapi({
    description: "Description of the tracker entry",
    example: "Worked on feature X",
  }),
  rate: z.number().nullable().openapi({
    description: "Hourly rate for the entry",
    example: 50,
  }),
  currency: z.string().nullable().openapi({
    description: "Currency code",
    example: "USD",
  }),
  billed: z.boolean().openapi({
    description: "Whether the entry has been billed",
    example: false,
  }),
  date: z.string().openapi({
    description: "Date of the entry (YYYY-MM-DD)",
    example: "2025-04-15",
  }),
  user: z.object({
    id: z.string().uuid().openapi({
      description: "User ID",
      example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    }),
    fullName: z.string().openapi({
      description: "Full name of the user",
      example: "Jane Doe",
    }),
    avatarUrl: z.string().openapi({
      description: "Avatar URL of the user",
      example: "https://example.com/avatar.jpg",
    }),
  }),
  project: z.object({
    id: z.string().uuid().openapi({
      description: "Project ID",
      example: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
    }),
    createdAt: z.string().openapi({
      description: "Project creation timestamp (ISO 8601)",
      example: "2025-03-01T10:00:00Z",
    }),
    rate: z.number().openapi({
      description: "Project hourly rate",
      example: 50,
    }),
    currency: z.string().openapi({
      description: "Project currency code",
      example: "USD",
    }),
    status: z.string().openapi({
      description: "Project status",
      example: "active",
    }),
    description: z.string().openapi({
      description: "Project description",
      example: "Website redesign",
    }),
    name: z.string().openapi({
      description: "Project name",
      example: "Redesign Project",
    }),
    billable: z.boolean().openapi({
      description: "Whether the project is billable",
      example: true,
    }),
    estimate: z.number().openapi({
      description: "Estimated hours for the project",
      example: 120,
    }),
    customer: z.object({
      id: z.string().openapi({
        description: "Customer ID",
        example: "customer-1234",
      }),
      name: z.string().openapi({
        description: "Customer name",
        example: "Acme Corp",
      }),
    }),
  }),
});

export const trackerEntriesResponseSchema = z.object({
  meta: z.object({
    totalDuration: z.number().openapi({
      description: "Total duration of all entries",
      example: 81000,
    }),
    totalAmount: z.number().openapi({
      description: "Total amount for all entries",
      example: 22500,
    }),
    from: z.string().openapi({
      description: "Start date of the range",
      example: "2025-04-01",
    }),
    to: z.string().openapi({
      description: "End date of the range",
      example: "2025-04-30",
    }),
  }),
  result: z.record(z.string(), z.array(trackerEntryResponseSchema)).openapi({
    description:
      "Object with date as key and array of tracker entries as value",
  }),
});
