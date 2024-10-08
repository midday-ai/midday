import { z } from "@hono/zod-openapi";

/**
 * Schema for error responses.
 * @property {string} code - The error code.
 * @property {string} message - A detailed error message.
 * @property {string} requestId - A unique identifier for the request.
 */
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

/**
 * Schema for general error responses.
 * @property {string} code - The error code, typically for internal server errors.
 * @property {string} message - A general error message.
 * @property {string} requestId - A unique identifier for the request.
 */
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

/**
 * Enum of supported providers.
 * @enum {string}
 */
export const Providers = z.enum(["teller", "plaid", "gocardless", "stripe"]);

/**
 * Schema for request headers.
 * @property {string} authorization - The authorization token, typically a Bearer token.
 */
export const HeadersSchema = z.object({
  authorization: z.string().openapi({
    example: "Bearer SECRET",
  }),
});
