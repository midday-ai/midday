import type { Bindings } from "@/common/bindings";
import { swaggerUI } from "@hono/swagger-ui";
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
import healthRoutes from "./routes/health";
import institutionRoutes from "./routes/institutions";
import ratesRoutes from "./routes/rates";
import transactionsRoutes from "./routes/transactions";

const app = new OpenAPIHono<{ Bindings: Bindings }>({
  defaultHook: (result, c) => {
    console.log(result);
    if (!result.success) {
      return c.json({ success: false, errors: result.error.errors }, 422);
    }
  },
});

app.use("*", requestId());
app.use(authMiddleware);
app.use(securityMiddleware);
app.use(loggingMiddleware);

// Enable cache for the following routes
app.get("/institutions", cacheMiddleware);
app.get("/accounts", cacheMiddleware);
app.get("/accounts/balance", cacheMiddleware);
app.get("/transactions", cacheMiddleware);
app.get("/rates", cacheMiddleware);

app
  .route("/transactions", transactionsRoutes)
  .route("/accounts", accountRoutes)
  .route("/institutions", institutionRoutes)
  .route("/rates", ratesRoutes)
  .route("/auth", authRoutes);

app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
});

app.get(
  "/",
  swaggerUI({
    url: "/openapi",
  }),
);

app.doc("/openapi", {
  openapi: "3.1.0",
  info: {
    version: "1.0.0",
    title: "Midday Engine API",
  },
});

app.route("/health", healthRoutes);

export { Browser } from "./state/browser";

export default app;
