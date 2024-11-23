import { Providers } from "@/common/schema";
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
    example: Providers.Enum.teller,
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
    status: z.string().openapi({
      example: "connected",
    }),
    expiresAt: z.string().openapi({
      example: "2024-11-22T10:00:00.000Z",
    }),
  })
  .openapi("ConnectionStatusSchema");
