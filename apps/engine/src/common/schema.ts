import { z } from "@hono/zod-openapi";

export const ErrorSchema = z.object({
  code: z.string().openapi({
    example: "bad_request",
  }),
  message: z.string().openapi({
    example: "Missing params.",
  }),
  requestId: z.string().openapi({
    example: "123e4567-e89b-12d3-a456-426655440000",
  }),
});

export const Providers = z.enum(["teller", "plaid", "gocardless"]);

export const HeadersSchema = z.object({
  authorization: z.string().openapi({
    example: "Bearer SECRET",
  }),
});
