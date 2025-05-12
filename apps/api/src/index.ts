import { trpcServer } from "@hono/trpc-server";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { poweredBy } from "hono/powered-by";
import { secureHeaders } from "hono/secure-headers";
import { connectDb } from "./db";
import { createTRPCContext } from "./trpc/init";
import { appRouter } from "./trpc/routers/_app";

const app = new Hono();

app.use(poweredBy());
app.use(secureHeaders());

app.use(
  "/trpc/*",
  cors({
    origin: ["http://localhost:3001", "https://app.midday.ai"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "x-trpc-source",
      "x-team-id",
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
    const db = await connectDb();
    await db.execute(sql`SELECT 1`);

    return c.json({ status: "ok" }, 200);
  } catch (error) {
    return c.json({ status: "error" }, 500);
  }
});

export default {
  port: process.env.PORT ? Number.parseInt(process.env.PORT) : 3000,
  fetch: app.fetch,
};
