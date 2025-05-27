import { z } from "@hono/zod-openapi";

export const getTrackerProjectsSchema = z.object({
  cursor: z.string().nullable().optional(),
  pageSize: z.coerce.number().min(1).max(100).optional(),
  q: z.string().nullable().optional(),
  start: z.string().nullable().optional(),
  end: z.string().nullable().optional(),
  status: z.enum(["in_progress", "completed"]).nullable().optional(),
  customers: z.array(z.string()).nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  sort: z.array(z.string()).nullable().optional(),
});

export const upsertTrackerProjectSchema = z
  .object({
    id: z.string().uuid().optional().openapi({
      description: "Project ID (for update only)",
      example: "b7e6c8e2-1f2a-4c3b-9e2d-1a2b3c4d5e6f",
    }),
    name: z.string().min(1).openapi({
      description: "Project name",
      example: "Website Redesign",
    }),
    description: z.string().nullable().optional().openapi({
      description: "Project description",
      example: "Redesign the company website for better UX.",
    }),
    estimate: z.number().nullable().optional().openapi({
      description: "Estimated hours for the project",
      example: 120,
    }),
    billable: z.boolean().nullable().optional().default(false).openapi({
      description: "Whether the project is billable",
      example: true,
    }),
    rate: z.number().min(1).nullable().optional().openapi({
      description: "Hourly rate for the project",
      example: 100,
    }),
    currency: z.string().nullable().optional().openapi({
      description: "Currency code (ISO 4217)",
      example: "USD",
    }),
    status: z.enum(["in_progress", "completed"]).optional().openapi({
      description: "Project status",
      example: "in_progress",
    }),
    customerId: z.string().uuid().nullable().optional().openapi({
      description: "Customer ID associated with the project",
      example: "a1b2c3d4-e5f6-7890-abcd-1234567890ef",
    }),
    tags: z
      .array(
        z.object({
          id: z.string().uuid().openapi({
            description: "Tag ID",
            example: "f1e2d3c4-b5a6-7890-1234-567890abcdef",
          }),
          value: z.string().openapi({
            description: "Tag value",
            example: "Design",
          }),
        }),
      )
      .optional()
      .nullable()
      .openapi({
        description: "List of tags to associate with the project",
        example: [
          { id: "f1e2d3c4-b5a6-7890-1234-567890abcdef", value: "Design" },
          { id: "e2d3c4b5-a6f1-7890-1234-567890abcdef", value: "Frontend" },
        ],
      }),
  })
  .openapi("UpsertTrackerProject");

export const deleteTrackerProjectSchema = z.object({ id: z.string().uuid() });

export const getTrackerProjectByIdSchema = z.object({ id: z.string().uuid() });

export const trackerProjectResponseSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Project ID",
      example: "b7e6c8e2-1f2a-4c3b-9e2d-1a2b3c4d5e6f",
    }),
    name: z.string().openapi({
      description: "Project name",
      example: "Website Redesign",
    }),
    description: z.string().nullable().openapi({
      description: "Project description",
      example: "Redesign the company website for better UX.",
    }),
    status: z.enum(["in_progress", "completed"]).openapi({
      description: "Project status",
      example: "in_progress",
    }),
    estimate: z.number().nullable().openapi({
      description: "Estimated hours for the project",
      example: 120,
    }),
    currency: z.string().nullable().openapi({
      description: "Currency code (ISO 4217)",
      example: "USD",
    }),
    createdAt: z.string().openapi({
      description: "Project creation date (ISO 8601)",
      example: "2024-05-01T12:00:00.000Z",
    }),
    totalDuration: z.number().nullable().openapi({
      description: "Total tracked duration (seconds)",
      example: 36000,
    }),
    totalAmount: z.number().openapi({
      description: "Total amount billed for the project",
      example: 5000.5,
    }),
    customer: z
      .object({
        id: z.string().uuid().openapi({
          description: "Customer ID",
          example: "a1b2c3d4-e5f6-7890-abcd-1234567890ef",
        }),
        name: z.string().openapi({
          description: "Customer name",
          example: "Acme Corp",
        }),
        website: z.string().openapi({
          description: "Customer website",
          example: "https://acme.com",
        }),
      })
      .nullable()
      .openapi({
        description: "Customer associated with the project",
      }),
    tags: z
      .array(
        z.object({
          id: z.string().uuid().openapi({
            description: "Tag ID",
            example: "d1e2f3a4-b5c6-7890-abcd-1234567890ef",
          }),
          name: z.string().openapi({
            description: "Tag name",
            example: "Design",
          }),
        }),
      )
      .openapi({
        description: "Tags associated with the project",
      }),
    users: z
      .array(
        z.object({
          id: z.string().uuid().openapi({
            description: "User ID",
            example: "f1e2d3c4-b5a6-7890-abcd-1234567890ef",
          }),
          fullName: z.string().openapi({
            description: "Full name of the user",
            example: "Jane Doe",
          }),
          avatarUrl: z.string().url().openapi({
            description: "URL to the user's avatar",
            example: "https://example.com/avatar.jpg",
          }),
        }),
      )
      .nullable()
      .openapi({
        description: "Users assigned to the project",
      }),
  })
  .openapi("TrackerProjectResponse");

export const trackerProjectsResponseSchema = z
  .object({
    meta: z
      .object({
        hasNextPage: z.boolean().openapi({
          description: "Whether there is a next page of results",
          example: true,
        }),
        hasPreviousPage: z.boolean().openapi({
          description: "Whether there is a previous page of results",
          example: false,
        }),
      })
      .openapi({
        description: "Pagination metadata",
      }),
    data: z.array(trackerProjectResponseSchema).openapi({
      description: "List of tracker projects",
    }),
  })
  .openapi("TrackerProjectsResponse");
