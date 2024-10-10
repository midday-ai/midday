import { z } from "@hono/zod-openapi";

/**
 * Schema for individual health check responses.
 * @property {boolean} healthy - Indicates if the service is healthy.
 * @property {string} [message] - Optional message providing additional health check details.
 */
export const HealthCheckResponseSchema = z.object({
  healthy: z.boolean(),
  message: z.string().optional(),
}).openapi("HealthCheckResponse");

/**
 * Schema for the overall health check response.
 * @property {Object} data - Contains health status for various services.
 * @property {Object} data.search - Health status for the search service.
 * @property {HealthCheckResponseSchema} data.teller - Health status for the Teller service.
 * @property {HealthCheckResponseSchema} data.gocardless - Health status for the GoCardless service.
 * @property {HealthCheckResponseSchema} data.plaid - Health status for the Plaid service.
 */
export const HealthSchema = z.object({
  data: z.object({
    search: z.object({ healthy: z.boolean() }),
    teller: HealthCheckResponseSchema,
    gocardless: HealthCheckResponseSchema,
    plaid: HealthCheckResponseSchema,
  }),
}).openapi("HealthSchema");
