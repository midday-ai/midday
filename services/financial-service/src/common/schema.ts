import { z } from "@hono/zod-openapi";

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
