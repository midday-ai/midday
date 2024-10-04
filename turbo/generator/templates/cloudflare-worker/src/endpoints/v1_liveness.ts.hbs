import { createRoute, z } from "@hono/zod-openapi";
import { openApiErrorResponses } from "../pkg/errors";
import type { App } from "../pkg/hono/app";

const route = createRoute({
  tags: ["liveness"],
  operationId: "v1.liveness",
  method: "get",
  path: "/v1/liveness",
  responses: {
    200: {
      description: "The configured services and their status",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({
              description: "The status of the server",
            }),
            services: z.object({
              metrics: z.string().openapi({
                description: "The name of the connected metrics service",
                example: "AxiomMetrics",
              }),
              logger: z.string().openapi({
                description: "The name of the connected logger service",
                example: "AxiomLogger or ConsoleLogger",
              }),
              database: z.string().openapi({
                description: "The name of the connected database service",
                example: "D1Database",
              }),
              service: z.string().openapi({
                description: "The name of the connected account service",
                example: "AccountService",
              }),
            }),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export type V1LivenessResponse = z.infer<
  (typeof route.responses)[200]["content"]["application/json"]["schema"]
>;
export const registerV1Liveness = (app: App) =>
  app.openapi(route, async (c) => {
    const { logger, metrics } = c.get("services");

    const result = await c.env.DB.exec("SELECT 1");

    const services = {
      metrics: metrics.constructor.name,
      logger: logger.constructor.name,
      database: result.count === 1 ? "live" : "error",
      service: app.constructor.name,
    };

    return c.json(
      {
        status: "operational",
        services: {
          metrics: metrics.constructor.name,
          logger: logger.constructor.name,
          database: "live",
          service: app.constructor.name,
        },
      },
      200,
    );
  });
