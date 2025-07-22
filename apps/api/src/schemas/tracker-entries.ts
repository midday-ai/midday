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

export const bulkCreateTrackerEntriesSchema = z.object({
  entries: z
    .array(upsertTrackerEntriesSchema.omit({ id: true }))
    .max(100)
    .min(1)
    .openapi({
      description:
        "Array of tracker entries to create (maximum 100 entries per request)",
      example: [
        {
          start: "2024-04-15T09:00:00.000Z",
          stop: "2024-04-15T17:00:00.000Z",
          dates: ["2024-04-15"],
          assignedId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          projectId: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
          description: "Working on authentication feature",
          duration: 28800,
        },
        {
          start: "2024-04-16T09:00:00.000Z",
          stop: "2024-04-16T17:00:00.000Z",
          dates: ["2024-04-16"],
          assignedId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          projectId: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
          description: "Working on dashboard feature",
          duration: 28800,
        },
      ],
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
      rate: z.number().nullable().openapi({
        description: "Default hourly rate for the project",
        example: 75.0,
      }),
      currency: z.string().nullable().openapi({
        description: "Currency code for the project rate in ISO 4217 format",
        example: "USD",
      }),
      status: z.string().openapi({
        description: "Current status of the project",
        example: "in_progress",
      }),
      description: z.string().nullable().openapi({
        description: "Description of the project",
        example: "Complete website redesign with modern UI/UX",
      }),
      name: z.string().openapi({
        description: "Name of the project",
        example: "Website Redesign Project",
      }),
      billable: z.boolean().nullable().openapi({
        description: "Whether the project is billable to the customer",
        example: true,
      }),
      estimate: z.number().nullable().openapi({
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
        .nullable()
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

// Timer schemas (improved naming and functionality)
export const startTimerSchema = z.object({
  projectId: z.string().uuid().openapi({
    description: "Unique identifier of the project to track time for",
    example: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
  }),
  assignedId: z.string().uuid().optional().nullable().openapi({
    description:
      "Unique identifier of the user to assign the timer to. If not provided, will use the authenticated user",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  }),
  description: z.string().optional().nullable().openapi({
    description: "Optional description for the timer session",
    example: "Working on implementing timer feature",
  }),
  start: z.string().datetime().optional().openapi({
    description:
      "Start time in ISO 8601 format. If not provided, will use current time",
    example: "2024-04-15T09:00:00.000Z",
  }),
  continueFromEntry: z.string().uuid().optional().openapi({
    description: "Continue from a specific paused entry ID",
    example: "c4d5e6f7-2a3b-4c5d-8e9f-3a4b5c6d7e8f",
  }),
});

export const stopTimerSchema = z.object({
  entryId: z.string().uuid().optional().openapi({
    description:
      "Unique identifier of the specific timer entry to stop. If not provided, will stop the current running timer for the user",
    example: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
  }),
  assignedId: z.string().uuid().optional().nullable().openapi({
    description:
      "Unique identifier of the user whose timer should be stopped. If not provided, will use the authenticated user",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  }),
  stop: z.string().datetime().optional().openapi({
    description:
      "Stop time in ISO 8601 format. If not provided, will use current time",
    example: "2024-04-15T17:00:00.000Z",
  }),
});

export const pauseTimerSchema = z.object({
  entryId: z.string().uuid().optional().openapi({
    description:
      "Unique identifier of the specific timer entry to pause. If not provided, will pause the current running timer for the user",
    example: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
  }),
  assignedId: z.string().uuid().optional().nullable().openapi({
    description:
      "Unique identifier of the user whose timer should be paused. If not provided, will use the authenticated user",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  }),
  pause: z.string().datetime().optional().openapi({
    description:
      "Pause time in ISO 8601 format. If not provided, will use current time",
    example: "2024-04-15T12:00:00.000Z",
  }),
});

export const getCurrentTimerSchema = z.object({
  assignedId: z.string().uuid().optional().nullable().openapi({
    description:
      "Unique identifier of the user whose current timer should be retrieved. If not provided, will use the authenticated user",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  }),
});

// Reuse existing trackerEntryResponseSchema but make duration nullable for running entries
export const timerResponseSchema = trackerEntryResponseSchema.extend({
  duration: z.number().nullable().openapi({
    description:
      "Duration of the timer entry in seconds. -1 indicates running, null for paused, positive number for completed",
    example: -1,
  }),
});

export const timerStatusSchema = z.object({
  isRunning: z.boolean().openapi({
    description: "Whether there is currently a running timer",
    example: true,
  }),
  currentEntry: z
    .object({
      id: z.string().uuid(),
      start: z.string().nullable(),
      description: z.string().nullable(),
      projectId: z.string().uuid(),
      trackerProject: z.object({
        id: z.string().uuid(),
        name: z.string(),
      }),
    })
    .nullable()
    .openapi({
      description: "Current running timer details, null if not running",
    }),
  elapsedTime: z.number().openapi({
    description: "Elapsed time in seconds for the current running timer",
    example: 1800,
  }),
});

export const pausedEntriesSchema = z
  .array(
    z.object({
      id: z.string().uuid(),
      start: z.string().nullable(),
      stop: z.string().nullable(),
      duration: z.number().nullable(),
      description: z.string().nullable(),
      projectId: z.string().uuid(),
      trackerProject: z.object({
        id: z.string().uuid(),
        name: z.string(),
      }),
    }),
  )
  .openapi({
    description: "List of paused timer entries that can be resumed",
  });

export const createTrackerEntriesResponseSchema = z
  .object({
    data: z.array(trackerEntryResponseSchema).openapi({
      description: "Array of created tracker entries",
    }),
  })
  .openapi({
    description: "Response schema for created tracker entries",
  });
