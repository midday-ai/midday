import { z } from "@hono/zod-openapi";

export const ErrorSchema = z.object({
  code: z.string().openapi({
    example: "disconnected",
  }),
  message: z.string().openapi({
    example:
      "The login details of this item have changed (credentials, MFA, or required user action) and a user login is required to update this information.",
  }),
  requestId: z.string().openapi({
    example: "123e4567-e89b-12d3-a456-426655440000",
  }),
});

export const GeneralErrorSchema = z.object({
  code: z.string().openapi({
    example: "internal_server_error",
  }),
  message: z.string().openapi({
    example: "Internal server error",
  }),
  requestId: z.string().openapi({
    example: "123e4567-e89b-12d3-a456-426655440000",
  }),
});

export const Providers = z.enum([
  "teller",
  "plaid",
  "gocardless",
  "enablebanking",
]);

export const HeadersSchema = z.object({
  authorization: z.string().openapi({
    example: "Bearer SECRET",
  }),
});
