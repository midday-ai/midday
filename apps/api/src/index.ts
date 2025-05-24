import { trpcServer } from "@hono/trpc-server";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { openAPISpecs } from "hono-openapi";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { routers } from "./rest/routers";
import { createTRPCContext } from "./trpc/init";
import { appRouter } from "./trpc/routers/_app";
import { checkHealth } from "./utils/health";

const app = new Hono();

app.use(secureHeaders());

app.use(
  "/trpc/*",
  cors({
    origin: process.env.ALLOWED_API_ORIGINS?.split(",") ?? [],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: [
      "Authorization",
      "Content-Type",
      "accept-language",
      "x-trpc-source",
      "x-user-locale",
      "x-user-timezone",
      "x-user-country",
    ],
    exposeHeaders: ["Content-Length"],
    maxAge: 86400,
    credentials: true,
  }),
);

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: createTRPCContext,
  }),
);

app.get("/health", async (c) => {
  try {
    await checkHealth();

    return c.json({ status: "ok" }, 200);
  } catch (error) {
    return c.json({ status: "error" }, 500);
  }
});

app.route("/", routers);
app.get(
  "/openapi",
  openAPISpecs(app, {
    documentation: {
      info: {
        title: "Midday API",
        version: "1.0.0",
        description: "API for Midday",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "Bearer",
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
      servers: [
        {
          url: "https://api.midday.ai",
          description: "Production server",
        },
      ],
    },
  }),
);

app.get(
  "/",
  Scalar({ url: "/openapi", pageTitle: "Midday API", theme: "saturn" }),
);

export default {
  port: process.env.PORT ? Number.parseInt(process.env.PORT) : 3000,
  fetch: app.fetch,
};
