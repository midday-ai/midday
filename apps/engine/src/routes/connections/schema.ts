import { Providers } from "@engine/common/schema";
import { z } from "@hono/zod-openapi";

export const ConnectionStatusQuerySchema = z.object({
  id: z
    .string()
    .optional()
    .openapi({
      description: "GoCardLess reference id",
      param: {
        name: "id",
        in: "query",
      },
      example: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    }),
  provider: Providers.openapi({
    example: Providers.enum.teller,
  }),
  accessToken: z
    .string()
    .optional()
    .openapi({
      description: "Teller or Plaid access token",
      param: {
        name: "accessToken",
        in: "query",
      },
      example: "test_token_ky6igyqi3qxa4",
    }),
});

export const ConnectionStatusSchema = z
  .object({
    data: z.object({
      status: z.string().openapi({
        example: "connected",
      }),
    }),
  })
  .openapi("ConnectionStatusSchema");

export const ConnectionDeletedSchema = z.object({
  data: z.object({
    success: z.boolean(),
  }),
});

export const DeleteConnectionBodySchema = z.object({
  id: z
    .string()
    .optional()
    .openapi({
      description: "GoCardLess or Enable Banking reference id",
      param: {
        name: "id",
        in: "query",
      },
      example: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    }),
  provider: Providers.openapi({
    example: Providers.enum.teller,
  }),
  accessToken: z
    .string()
    .optional()
    .openapi({
      description: "Teller or Plaid access token",
      param: {
        name: "accessToken",
        in: "query",
      },
      example: "test_token_ky6igyqi3qxa4",
    }),
});

export const ConnectionByReferenceParamsSchema = z.object({
  reference: z.string().openapi({
    description: "GoCardLess reference id",
    param: {
      name: "reference",
      in: "path",
    },
  }),
});

export const ConnectionByReferenceSchema = z.object({
  data: z.object({
    id: z.string(),
    accounts: z.array(z.string()),
  }),
});

export const GoCardLessConnectionSchema = z.object({
  id: z.string(),
  created: z.string(),
  redirect: z.string(),
  status: z.enum(["CR", "GC", "UA", "RJ", "SA", "GA", "LN", "EX"]),
  institution_id: z.string(),
  agreement: z.string(),
  reference: z.string(),
  accounts: z.array(z.string()),
  user_language: z.string(),
  link: z.string(),
  ssn: z.string(),
  account_selection: z.boolean(),
  redirect_immediate: z.boolean(),
});

export const GoCardLessConnectionsSchema = z.object({
  count: z.number(),
  next: z.string(),
  previous: z.string(),
  results: z.array(GoCardLessConnectionSchema),
});
