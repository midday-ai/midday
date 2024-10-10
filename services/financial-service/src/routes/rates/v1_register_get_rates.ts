import { openApiErrorResponses as ErrorResponses } from "@/errors";
import { App } from "@/hono/app";
import { createErrorResponse } from "@/utils/error";
import { getRates } from "@/utils/rates";
import { createRoute, z } from "@hono/zod-openapi";
import { RatesSchema } from "./schema";

/**
 * OpenAPI route configuration for retrieving rates.
 * @constant
 */
const route = createRoute({
  tags: ["apis"],
  operationId: "getRatesApi",
  method: "get",
  path: "/rates",
  summary: "Get rates",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: RatesSchema,
        },
      },
      description: "Retrieve rates",
    },
    ...ErrorResponses
  },
});

export type GetRatesRoute = typeof route;
export type GetRatesResponse = z.infer<(typeof route.responses)[200]["content"]["application/json"]["schema"]>;

/**
 * Registers the GET rates endpoint with the application.
 * 
 * This function sets up a route to handle the retrieval of rates. It performs the following steps:
 * 1. Attempts to fetch rates using the getRates utility function.
 * 2. Returns the rates data on success.
 * 3. Handles any errors and returns an appropriate error response.
 * 
 * @param {App} app - The OpenAPIHono application instance.
 * @returns {void}
 * 
 * @example
 * // Usage in main application file
 * import { registerGetRates } from './routes/rates';
 * 
 * const app = new App();
 * registerGetRates(app);
 */
export const registerGetRates = (app: App) => {
  app.openapi(route, async (c) => {
    try {
      /**
       * Fetch rates data.
       * @type {Array<{ source: string; date: unknown; rates: any; }>}
       */
      const data = await getRates();

      return c.json({ data }, 200);
    } catch (error) {
      // Handle any errors that occur during the search or data processing
      const { message, code } = createErrorResponse(error, c.get("requestId"));

      return c.json({
        error: {
          message,
          docs: "https://engineering-docs.solomon-ai.app/errors",
          requestId: c.get("requestId"),
          code,
        }
      }, 400);
    }
  });
};