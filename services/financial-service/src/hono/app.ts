import { handleError, handleZodError } from "@/errors";
import { authMiddleware, cacheMiddleware, cors, errorHandlerMiddleware, jsonFormattingMiddleware, loggingMiddleware } from "@/middleware/index";
import { init } from "@/middleware/init";
import { metrics } from "@/middleware/metrics";
import { rateLimit } from "@/middleware/ratelimit";
import { AuthenticationRequiredRoutes, CachedRoutes } from "@/route-definitions/routes";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import type { Context as GenericContext } from "hono";
import { prettyJSON } from "hono/pretty-json";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { timing } from "hono/timing";
import type { HonoEnv } from "./env";

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
  setupAuthentication(app);
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
  app.use("*", loggingMiddleware);
  app.use("*", errorHandlerMiddleware);
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
 * Sets up caching for specific GET routes in the application.
 * 
 * This function applies caching middleware only to GET requests for routes that should be cached.
 * 
 * @param {OpenAPIHono<HonoEnv>} app - The OpenAPIHono application instance.
 */
function setupCaching(app: OpenAPIHono<HonoEnv>) {
  CachedRoutes.forEach(route => app.get(route.path, cacheMiddleware));
}

/**
 * Set up authentication middleware for the application's specific routes.
 * 
 * @param {OpenAPIHono<HonoEnv>} app - The OpenAPIHono application instance.
 */
function setupAuthentication(app: OpenAPIHono<HonoEnv>) {
  AuthenticationRequiredRoutes.forEach(route => app.use(route.path, authMiddleware));
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

  app.doc("/openapi", {
    openapi: "3.1.0",
    info: {
      version: "1.0.0",
      title: "Solomon AI Financial Service API",
      description: "API for Solomon AI Financial Service",
      termsOfService: "https://solomon-ai.app/terms",
      contact: {
        name: "Solomon AI",
        url: "https://solomon-ai.app",
        email: "engineering@solomon-ai.co",
      },
      license: {
        name: "AGPL-3.0-or-later",
        url: "https://www.gnu.org/licenses/agpl-3.0.en.html",
      },
    },
    servers: [
      {
        url: "https://engine.solomon-ai-platform.com",
        description: "Production Environment",
        variables: {
          region: {
            enum: ["us-east", "us-west", "eu-central"],
            default: "us-east",
          },
        },
      },
      {
        url: "https://engine-staging.solomon-ai-platform.com",
        description: "Staging Environment",
      },
      {
        url: "http://localhost:8787",
        description: "Local Development",
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
    "x-solomon-ai": {
      postman: {
        name: "Solomon AI Financial API",
        description: "Postman collection for Solomon AI Financial Service API",
      },
      sdks: {
        typescript: {
          githubRepo: "solomon-ai/typescript-sdk",
          version: "1.0.0",
        },
        python: {
          githubRepo: "solomon-ai/python-sdk",
          version: "1.0.0",
        },
      },
    },
    externalDocs: {
      description: "Additional Documentation",
      url: "https://engineering-docs.solomon-ai.com",
    },
    security: [
      { bearerAuth: [] },
      { apiKey: [] },
    ],

  });

  app.get("/", swaggerUI({
    url: "/openapi"
  }));

  // Mount API documentation at additional endpoints
  app.get("/docs", (c) => c.redirect("/"));
  app.get("/swagger", (c) => c.redirect("/"));
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
