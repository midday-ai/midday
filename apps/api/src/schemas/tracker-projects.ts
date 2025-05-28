import { z } from "@hono/zod-openapi";

export const getTrackerProjectsSchema = z.object({
  cursor: z
    .string()
    .nullable()
    .optional()
    .openapi({
      description:
        "Cursor for pagination, representing the last item from the previous page",
      example: "eyJpZCI6IjEyMyJ9",
      param: {
        in: "query",
      },
    }),
  pageSize: z.coerce
    .number()
    .min(1)
    .max(100)
    .optional()
    .openapi({
      description: "Number of projects to return per page (1-100)",
      example: 20,
      param: {
        in: "query",
      },
    }),
  q: z
    .string()
    .nullable()
    .optional()
    .openapi({
      description:
        "Search query string to filter projects by name or description",
      example: "website",
      param: {
        in: "query",
      },
    }),
  start: z
    .string()
    .nullable()
    .optional()
    .openapi({
      description:
        "Start date for filtering projects by creation date in YYYY-MM-DD format",
      example: "2024-04-01",
      param: {
        in: "query",
      },
    }),
  end: z
    .string()
    .nullable()
    .optional()
    .openapi({
      description:
        "End date for filtering projects by creation date in YYYY-MM-DD format",
      example: "2024-04-30",
      param: {
        in: "query",
      },
    }),
  status: z
    .enum(["in_progress", "completed"])
    .nullable()
    .optional()
    .openapi({
      description: "Filter projects by status",
      example: "in_progress",
      param: {
        in: "query",
      },
    }),
  customers: z
    .array(z.string())
    .nullable()
    .optional()
    .openapi({
      description:
        "Array of customer IDs to filter projects by specific customers",
      example: ["customer-1", "customer-2"],
      param: {
        in: "query",
      },
    }),
  tags: z
    .array(z.string())
    .nullable()
    .optional()
    .openapi({
      description: "Array of tag IDs to filter projects by specific tags",
      example: ["tag-1", "tag-2"],
      param: {
        in: "query",
      },
    }),
  sort: z
    .array(z.string())
    .nullable()
    .optional()
    .openapi({
      description:
        "Sorting order as an array of field names. Prefix with '-' for descending order",
      example: ["-createdAt", "name"],
      param: {
        in: "query",
      },
    }),
});

export const upsertTrackerProjectSchema = z
  .object({
    id: z.string().uuid().optional().openapi({
      description:
        "Unique identifier for the project. Required for updates, omit for new projects",
      example: "b7e6c8e2-1f2a-4c3b-9e2d-1a2b3c4d5e6f",
    }),
    name: z.string().min(1).openapi({
      description: "Name of the project",
      example: "Website Redesign",
    }),
    description: z.string().nullable().optional().openapi({
      description: "Detailed description of the project",
      example:
        "Complete redesign of the company website with modern UI/UX and improved performance",
    }),
    estimate: z.number().nullable().optional().openapi({
      description: "Estimated total hours required to complete the project",
      example: 120,
    }),
    billable: z.boolean().nullable().optional().default(false).openapi({
      description: "Whether the project is billable to the customer",
      example: true,
    }),
    rate: z.number().min(1).nullable().optional().openapi({
      description: "Hourly rate for the project in the specified currency",
      example: 75.0,
    }),
    currency: z.string().nullable().optional().openapi({
      description: "Currency code for the project rate in ISO 4217 format",
      example: "USD",
    }),
    status: z.enum(["in_progress", "completed"]).optional().openapi({
      description: "Current status of the project",
      example: "in_progress",
    }),
    customerId: z.string().uuid().nullable().optional().openapi({
      description:
        "Unique identifier of the customer associated with this project",
      example: "a1b2c3d4-e5f6-7890-abcd-1234567890ef",
    }),
    tags: z
      .array(
        z.object({
          id: z.string().uuid().openapi({
            description: "Unique identifier of the tag",
            example: "f1e2d3c4-b5a6-7890-1234-567890abcdef",
          }),
          value: z.string().openapi({
            description: "Display value of the tag",
            example: "Design",
          }),
        }),
      )
      .optional()
      .nullable()
      .openapi({
        description: "Array of tags to associate with the project",
        example: [
          { id: "f1e2d3c4-b5a6-7890-1234-567890abcdef", value: "Design" },
          { id: "e2d3c4b5-a6f1-7890-1234-567890abcdef", value: "Frontend" },
        ],
      }),
  })
  .openapi("UpsertTrackerProject");

export const deleteTrackerProjectSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Unique identifier of the project to delete",
    example: "b7e6c8e2-1f2a-4c3b-9e2d-1a2b3c4d5e6f",
  }),
});

export const getTrackerProjectByIdSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Unique identifier of the project to retrieve",
    example: "b7e6c8e2-1f2a-4c3b-9e2d-1a2b3c4d5e6f",
  }),
});

export const trackerProjectResponseSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Unique identifier of the project",
      example: "b7e6c8e2-1f2a-4c3b-9e2d-1a2b3c4d5e6f",
    }),
    name: z.string().openapi({
      description: "Name of the project",
      example: "Website Redesign",
    }),
    description: z.string().nullable().openapi({
      description: "Detailed description of the project",
      example:
        "Complete redesign of the company website with modern UI/UX and improved performance",
    }),
    status: z.enum(["in_progress", "completed"]).openapi({
      description: "Current status of the project",
      example: "in_progress",
    }),
    estimate: z.number().nullable().openapi({
      description: "Estimated total hours required to complete the project",
      example: 120,
    }),
    currency: z.string().nullable().openapi({
      description: "Currency code for the project rate in ISO 4217 format",
      example: "USD",
    }),
    createdAt: z.string().openapi({
      description:
        "Date and time when the project was created in ISO 8601 format",
      example: "2024-05-01T12:00:00.000Z",
    }),
    totalDuration: z.number().nullable().openapi({
      description: "Total tracked time for the project in seconds",
      example: 43200,
    }),
    totalAmount: z.number().openapi({
      description: "Total monetary amount earned from the project",
      example: 3600.0,
    }),
    customer: z
      .object({
        id: z.string().uuid().openapi({
          description: "Unique identifier of the customer",
          example: "a1b2c3d4-e5f6-7890-abcd-1234567890ef",
        }),
        name: z.string().openapi({
          description: "Name of the customer or organization",
          example: "Acme Corporation",
        }),
        website: z.string().openapi({
          description: "Website URL of the customer",
          example: "https://acme.com",
        }),
      })
      .nullable()
      .openapi({
        description: "Customer information associated with the project",
      }),
    tags: z
      .array(
        z.object({
          id: z.string().uuid().openapi({
            description: "Unique identifier of the tag",
            example: "d1e2f3a4-b5c6-7890-abcd-1234567890ef",
          }),
          name: z.string().openapi({
            description: "Display name of the tag",
            example: "Design",
          }),
        }),
      )
      .openapi({
        description: "Array of tags associated with the project",
      }),
    users: z
      .array(
        z.object({
          id: z.string().uuid().openapi({
            description: "Unique identifier of the user",
            example: "f1e2d3c4-b5a6-7890-abcd-1234567890ef",
          }),
          fullName: z.string().openapi({
            description: "Full name of the user",
            example: "Jane Doe",
          }),
          avatarUrl: z.string().url().openapi({
            description: "URL to the user's avatar image",
            example: "https://cdn.midday.ai/avatar.jpg",
          }),
        }),
      )
      .nullable()
      .openapi({
        description: "Array of users assigned to work on the project",
      }),
  })
  .openapi("TrackerProjectResponse");

export const trackerProjectsResponseSchema = z
  .object({
    meta: z
      .object({
        hasNextPage: z.boolean().openapi({
          description:
            "Whether there are more projects available on the next page",
          example: true,
        }),
        hasPreviousPage: z.boolean().openapi({
          description:
            "Whether there are more projects available on the previous page",
          example: false,
        }),
      })
      .openapi({
        description: "Pagination metadata for the projects response",
      }),
    data: z.array(trackerProjectResponseSchema).openapi({
      description: "Array of tracker projects matching the query criteria",
    }),
  })
  .openapi("TrackerProjectsResponse");
