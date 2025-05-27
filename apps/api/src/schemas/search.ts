import { z } from "@hono/zod-openapi";

export const globalSearchSchema = z
  .object({
    searchTerm: z.string().optional().openapi({
      description: "The term to search for across all data sources.",
      example: "Acme",
    }),
    language: z.string().optional().openapi({
      description: "Language code to use for search relevance and results.",
      example: "en",
    }),
    limit: z.number().default(30).openapi({
      description: "Maximum number of results to return.",
      example: 30,
    }),
    itemsPerTableLimit: z.number().default(5).openapi({
      description: "Maximum number of results to return per table/entity.",
      example: 5,
    }),
    relevanceThreshold: z.number().default(0.01).openapi({
      description: "Minimum relevance score threshold for including a result.",
      example: 0.01,
    }),
  })
  .openapi({
    description:
      "Parameters for performing a global search across all data sources.",
  });

export const searchResponseSchema = z
  .array(
    z.object({
      id: z.string().openapi({
        description: "Unique identifier for the search result item.",
        example: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
      }),
      type: z.string().openapi({
        description:
          "Type of the entity returned (e.g., invoice, customer, transaction).",
        example: "invoice",
      }),
      relevance: z.number().openapi({
        description: "Relevance score for the search result.",
        example: 0.92,
      }),
      created_at: z.string().openapi({
        description: "ISO 8601 timestamp when the entity was created.",
        example: "2024-06-01T00:00:00.000Z",
      }),
      data: z.any().openapi({
        description:
          "Additional data for the search result, structure depends on the type.",
        example: {
          invoiceNumber: "INV-2024-001",
          customerName: "Acme Corporation",
          amount: 1500.75,
        },
      }),
    }),
  )
  .openapi({
    description: "Search results.",
    example: [
      {
        id: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
        type: "invoice",
        relevance: 0.92,
        created_at: "2024-06-01T00:00:00.000Z",
        data: {
          invoiceNumber: "INV-2024-001",
          customerName: "Acme Corporation",
          amount: 1500.75,
        },
      },
    ],
  });
