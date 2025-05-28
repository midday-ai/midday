import { z } from "@hono/zod-openapi";

export const getTrackerRecordsByDateSchema = z.object({
  date: z.string().openapi({
    description: "Date for which to fetch tracker records in YYYY-MM-DD format",
    example: "2024-04-15",
    param: {
      in: "query",
    },
  }),
});

export const getTrackerRecordsByRangeSchema = z.object({
  from: z.string().openapi({
    description: "Start date of the range (inclusive) in YYYY-MM-DD format",
    example: "2024-04-01",
    param: {
      in: "query",
    },
  }),
  to: z.string().openapi({
    description: "End date of the range (inclusive) in YYYY-MM-DD format",
    example: "2024-04-30",
    param: {
      in: "query",
    },
  }),
  projectId: z
    .string()
    .uuid()
    .optional()
    .openapi({
      description:
        "Optional project ID to filter tracker entries by specific project",
      example: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
      param: {
        in: "query",
      },
    }),
});

export const upsertTrackerEntriesSchema = z.object({
  id: z.string().uuid().optional().openapi({
    description:
      "Unique identifier for the tracker entry. Required for updates, omit for new entries",
    example: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
  }),
  start: z.string().datetime().openapi({
    description: "Start time of the tracker entry in ISO 8601 format",
    example: "2024-04-15T09:00:00.000Z",
  }),
  stop: z.string().datetime().openapi({
    description: "Stop time of the tracker entry in ISO 8601 format",
    example: "2024-04-15T17:00:00.000Z",
  }),
  dates: z
    .array(
      z.string().openapi({
        description: "Date in YYYY-MM-DD format",
        example: "2024-04-15",
      }),
    )
    .openapi({
      description: "Array of dates for which to create tracker entries",
      example: ["2024-04-15", "2024-04-16"],
    }),
  assignedId: z.string().uuid().nullable().openapi({
    description: "Unique identifier of the user assigned to this tracker entry",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  }),
  projectId: z.string().openapi({
    description:
      "Unique identifier of the project associated with this tracker entry",
    example: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
  }),
  description: z.string().optional().nullable().openapi({
    description: "Optional description or notes for the tracker entry",
    example: "Worked on implementing user authentication feature",
  }),
  duration: z.number().openapi({
    description: "Duration of the tracker entry in seconds",
    example: 28800,
  }),
});

export const deleteTrackerEntrySchema = z.object({
  id: z.string().uuid().openapi({
    description: "Unique identifier of the tracker entry to delete",
    example: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
  }),
});

export const trackerEntryResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Unique identifier of the tracker entry",
    example: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
  }),
  createdAt: z.string().openapi({
    description:
      "Date and time when the tracker entry was created in ISO 8601 format",
    example: "2024-04-15T09:00:00.000Z",
  }),
  duration: z.number().openapi({
    description: "Duration of the tracker entry in seconds",
    example: 28800,
  }),
  start: z.string().openapi({
    description: "Start time of the tracker entry in ISO 8601 format",
    example: "2024-04-15T09:00:00.000Z",
  }),
  stop: z.string().openapi({
    description: "Stop time of the tracker entry in ISO 8601 format",
    example: "2024-04-15T17:00:00.000Z",
  }),
  teamId: z.string().openapi({
    description: "Unique identifier of the team that owns this tracker entry",
    example: "team-1234",
  }),
  description: z.string().nullable().openapi({
    description: "Description or notes for the tracker entry",
    example: "Worked on implementing user authentication feature",
  }),
  rate: z.number().nullable().openapi({
    description: "Hourly rate applied to this tracker entry",
    example: 75.0,
  }),
  currency: z.string().nullable().openapi({
    description: "Currency code for the rate in ISO 4217 format",
    example: "USD",
  }),
  billed: z.boolean().openapi({
    description: "Whether this tracker entry has been billed to the customer",
    example: false,
  }),
  date: z.string().openapi({
    description: "Date of the tracker entry in YYYY-MM-DD format",
    example: "2024-04-15",
  }),
  user: z
    .object({
      id: z.string().uuid().openapi({
        description: "Unique identifier of the user",
        example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      }),
      fullName: z.string().openapi({
        description: "Full name of the user",
        example: "Jane Doe",
      }),
      avatarUrl: z.string().openapi({
        description: "URL to the user's avatar image",
        example: "https://cdn.midday.ai/avatar.jpg",
      }),
    })
    .openapi({
      description:
        "User information for the person who created this tracker entry",
    }),
  project: z
    .object({
      id: z.string().uuid().openapi({
        description: "Unique identifier of the project",
        example: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
      }),
      createdAt: z.string().openapi({
        description:
          "Date and time when the project was created in ISO 8601 format",
        example: "2024-03-01T10:00:00.000Z",
      }),
      rate: z.number().openapi({
        description: "Default hourly rate for the project",
        example: 75.0,
      }),
      currency: z.string().openapi({
        description: "Currency code for the project rate in ISO 4217 format",
        example: "USD",
      }),
      status: z.string().openapi({
        description: "Current status of the project",
        example: "in_progress",
      }),
      description: z.string().openapi({
        description: "Description of the project",
        example: "Complete website redesign with modern UI/UX",
      }),
      name: z.string().openapi({
        description: "Name of the project",
        example: "Website Redesign Project",
      }),
      billable: z.boolean().openapi({
        description: "Whether the project is billable to the customer",
        example: true,
      }),
      estimate: z.number().openapi({
        description: "Estimated total hours for the project",
        example: 120,
      }),
      customer: z
        .object({
          id: z.string().openapi({
            description: "Unique identifier of the customer",
            example: "customer-1234",
          }),
          name: z.string().openapi({
            description: "Name of the customer or organization",
            example: "Acme Corporation",
          }),
        })
        .openapi({
          description: "Customer information associated with the project",
        }),
    })
    .openapi({
      description: "Project information associated with this tracker entry",
    }),
});

export const trackerEntriesResponseSchema = z.object({
  meta: z
    .object({
      totalDuration: z.number().openapi({
        description:
          "Total duration of all tracker entries in the response in seconds",
        example: 86400,
      }),
      totalAmount: z.number().openapi({
        description:
          "Total monetary amount for all tracker entries in the response",
        example: 1800.0,
      }),
      from: z.string().openapi({
        description: "Start date of the queried range in YYYY-MM-DD format",
        example: "2024-04-01",
      }),
      to: z.string().openapi({
        description: "End date of the queried range in YYYY-MM-DD format",
        example: "2024-04-30",
      }),
    })
    .openapi({
      description:
        "Metadata about the tracker entries response including totals and date range",
    }),
  result: z.record(z.string(), z.array(trackerEntryResponseSchema)).openapi({
    description:
      "Tracker entries grouped by date, where each key is a date in YYYY-MM-DD format and the value is an array of tracker entries for that date",
  }),
});
