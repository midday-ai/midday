import type { Bindings } from "@/common/bindings";
import { OpenAPIHono } from "@hono/zod-openapi";
import { requestId } from "hono/request-id";
import {
  authMiddleware,
  cacheMiddleware,
  loggingMiddleware,
  securityMiddleware,
} from "./middleware";
import accountRoutes from "./routes/accounts";
import authRoutes from "./routes/auth";
import connectionRoutes from "./routes/connections";
import enrichRoutes from "./routes/enrich";
import healthRoutes from "./routes/health";
import institutionRoutes from "./routes/institutions";
import ratesRoutes from "./routes/rates";
import transactionsRoutes from "./routes/transactions";

const app = new OpenAPIHono<{ Bindings: Bindings }>({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json({ success: false, errors: result.error.errors }, 422);
    }
  },
});

app.use("*", requestId());
app.use(authMiddleware);
app.use(securityMiddleware);
app.use(loggingMiddleware);
app.get("/institutions", cacheMiddleware);
app.get("/rates", cacheMiddleware);

app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
});

app.get("/", (c) => {
  return c.redirect("https://midday.ai", 302);
});

const appRoutes = app
  .route("/transactions", transactionsRoutes)
  .route("/accounts", accountRoutes)
  .route("/institutions", institutionRoutes)
  .route("/auth", authRoutes)
  .route("/connections", connectionRoutes)
  .route("/health", healthRoutes)
  .route("/rates", ratesRoutes)
  .route("/enrich", enrichRoutes);

export type AppType = typeof appRoutes;

export default app;
