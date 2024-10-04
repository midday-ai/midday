import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import type { Context as GenericContext } from "hono";
import { prettyJSON } from "hono/pretty-json";
import { ServerHMRConnector } from "vite";
import { handleError, handleZodError } from "../errors";
import type { HonoEnv } from "./env";

// Configuration for OpenAPI
const openApiConfig = {
  openapi: "3.0.0",
  info: {
    title: "Template Service API",
    version: "1.0.0",
    description: "Template Service API for deploying service to Cloudflare",
  },
  "x-speakeasy-retries": {
    strategy: "backoff",
    backoff: {
      initialInterval: 50,
      maxInterval: 1_000,
      maxElapsedTime: 30_000,
      exponent: 1.5,
    },
    statusCodes: ["5XX", "4XX", "401", "403", "404", "409", "429"],
    retryConnectionErrors: true,
  },
};

/**
 * Creates and configures a new Hono app with OpenAPI integration
 * @returns {OpenAPIHono<HonoEnv>} Configured Hono app
 */
export function createApp(): OpenAPIHono<HonoEnv> {
  const app = new OpenAPIHono<HonoEnv>({
    defaultHook: handleZodError,
  });

  // Middleware setup
  app.use(prettyJSON());
  app.onError(handleError);

  // Add user agent to context
  app.use("*", async (c, next) => {
    c.set("userAgent", c.req.header("User-Agent") || "Unknown");
    await next();
  });

  // OpenAPI documentation routes
  app.doc("/openapi", openApiConfig);
  app.doc("/openapi.json", openApiConfig);

  // Register security scheme
  app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
    bearerFormat: "root key",
    type: "http",
    scheme: "bearer",
  });

  // Swagger UI route
  app.get(
    "/",
    swaggerUI({
      url: "/openapi",
    }),
  );

  return app;
}

export type App = ReturnType<typeof createApp>;
export type Context = GenericContext<HonoEnv>;
