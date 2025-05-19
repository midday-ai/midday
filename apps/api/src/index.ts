import { trpcServer } from "@hono/trpc-server";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { poweredBy } from "hono/powered-by";
import { secureHeaders } from "hono/secure-headers";
import { createTRPCContext } from "./trpc/init";
import { appRouter } from "./trpc/routers/_app";
import { checkHealth } from "./utils/health";

const app = new Hono();

app.use(poweredBy());
app.use(secureHeaders());

app.use(
  "/trpc/*",
  cors({
    origin: process.env.ALLOWED_API_ORIGINS?.split(",") ?? [],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "x-trpc-source",
      "x-team-id",
      "cf-ipcountry",
      "accept-language",
      "x-user-timezone",
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

app.get("/", Scalar({ url: "/doc", pageTitle: "Midday API", theme: "saturn" }));

export default {
  port: process.env.PORT ? Number.parseInt(process.env.PORT) : 3000,
  fetch: app.fetch,
};
