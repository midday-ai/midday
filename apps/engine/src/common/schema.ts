import { z } from "@hono/zod-openapi";

export const ErrorSchema = z.object({
  code: z.number().openapi({
    example: 400,
  }),
  message: z.string().openapi({
    example: "The provided input is invalid.",
  }),
  requestId: z.string().openapi({
    example: "123e4567-e89b-12d3-a456-426655440000",
  }),
  details: z
    .string()
    .openapi({
      example: "Provider must be defined.",
    })
    .optional(),
});

export const Providers = z.enum(["teller", "plaid", "gocardless"]);

export const HeadersSchema = z.object({
  authorization: z.string().openapi({
    example: "Bearer SECRET",
  }),
});
