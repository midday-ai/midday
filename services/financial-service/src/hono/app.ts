import { handleError, handleZodError } from "@/errors";
import { enrichContext } from "@/middleware/context-enrich";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import type { Context as GenericContext } from "hono";
import { prettyJSON } from "hono/pretty-json";
import { requestId } from "hono/request-id";
import type { HonoEnv } from "./env";
import { rateLimit } from "@/middleware/ratelimit";
import { metrics } from "@/middleware/metrics";
import { init } from "@/middleware/init";
import { authMiddleware, cacheMiddleware, cors, errorHandlerMiddleware, jsonFormattingMiddleware, loggingMiddleware } from "@/middleware/index";
import { secureHeaders } from "hono/secure-headers";
import { timing } from "hono/timing";
/**
 * Creates and configures a new OpenAPIHono application.
 * 
 * This function sets up the middleware, caching, routes, Swagger UI,
 * and OpenAPI registry for the application.
 * 
 * @returns {OpenAPIHono<HonoEnv>} A configured OpenAPIHono application instance.
 */
export function newApp(): OpenAPIHono<HonoEnv> {
  const app = new OpenAPIHono<HonoEnv>({ defaultHook: handleZodError });

  setupMiddleware(app);
  setupCaching(app);
  setupSwagger(app);
  setupOpenAPIRegistry(app);

  return app;
}

/**
 * Sets up middleware for the OpenAPIHono application.
 * 
 * This function adds various middleware to the application, including:
 * - Pretty JSON formatting
 * - Error handling
 * - Location and user agent setting
 * - Request ID generation
 * - Authentication
 * - Security
 * - Logging
 * - Error handling
 * - Timing
 * - CORS
 * - Caching
 * - JSON formatting
 * - Context enrichment
 * 
 * @param {OpenAPIHono<HonoEnv>} app - The OpenAPIHono application instance.
 */
function setupMiddleware(app: OpenAPIHono<HonoEnv>) {
  app.use("*", init());
  app.use("*", cors());
  app.use(prettyJSON());
  app.onError(handleError);
  app.use("*", setLocationAndUserAgent);
  app.use("*", requestId());
  app.use("*", authMiddleware);
  app.use("*", loggingMiddleware);
  app.use(enrichContext);
  app.use("*", errorHandlerMiddleware);
  app.use("*", cacheMiddleware);
  app.use("*", jsonFormattingMiddleware);
  app.use("*", rateLimit());
  app.use("*", metrics());
  app.use("*", secureHeaders());
  app.use("*", timing());
}

/**
 * Middleware function to set location and user agent in the context.
 * 
 * This function attempts to determine the client's location from various headers
 * and sets it in the context along with the user agent.
 * 
 * @param {GenericContext<HonoEnv>} c - The Hono context.
 * @param {() => Promise<void>} next - The next middleware function.
 * @returns {Promise<void>}
 */
function setLocationAndUserAgent(c: GenericContext<HonoEnv>, next: () => Promise<void>) {
  const location = (
    c.req.header("True-Client-IP") ??
    c.req.header("CF-Connecting-IP") ??
    // @ts-ignore - the cf object will be there on cloudflare
    c.req.raw?.cf?.colo ??
    ""
  ) as string;

  c.set("location", location);
  c.set("userAgent", c.req.header("User-Agent"));

  return next();
}

/**
 * Sets up caching for specific routes in the application.
 * 
 * This function applies caching middleware to a predefined list of routes.
 * 
 * @param {OpenAPIHono<HonoEnv>} app - The OpenAPIHono application instance.
 */
function setupCaching(app: OpenAPIHono<HonoEnv>) {
  const cachedRoutes = ["/institutions", "/accounts", "/accounts/balance", "/rates"];
  cachedRoutes.forEach(route => app.get(route, cacheMiddleware));
}

/**
 * Sets up Swagger UI and OpenAPI documentation for the application.
 * 
 * This function configures the Swagger UI endpoint and defines the OpenAPI
 * specification for the API.
 * 
 * @param {OpenAPIHono<HonoEnv>} app - The OpenAPIHono application instance.
 */
function setupSwagger(app: OpenAPIHono<HonoEnv>) {

  app.doc("/doc", {
    openapi: "3.1.0",
    info: {
      version: "1.0.0",
      title: "Solomon AI Financial Service API",
    },
    servers: [
      {
        url: "https://engine.solomon-ai-platform.com",
        description: "Production",
      },
    ],
    "x-speakeasy-retries": {
      strategy: "backoff",
      backoff: {
        initialInterval: 50,
        maxInterval: 1_000,
        maxElapsedTime: 30_000,
        exponent: 1.5,
      },
      statusCodes: ["5XX", "4XX"],
      retryConnectionErrors: true,
    },
  });

  app.get("/", swaggerUI({ url: "/doc" }));
}

/**
 * Sets up the OpenAPI registry for the application.
 * 
 * This function registers the security scheme for bearer authentication.
 * 
 * @param {OpenAPIHono<HonoEnv>} app - The OpenAPIHono application instance.
 */
function setupOpenAPIRegistry(app: OpenAPIHono<HonoEnv>) {
  app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
    bearerFormat: "root key",
    type: "http",
    scheme: "bearer",
  });
}

/** The type of the application created by newApp(). */
export type App = ReturnType<typeof newApp>;

/** The type of the context used in the application. */
export type Context = GenericContext<HonoEnv>;