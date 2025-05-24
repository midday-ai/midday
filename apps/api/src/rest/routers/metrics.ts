import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

const app = new Hono();

app.get(
  "/revenue",
  describeRoute({
    description: "Get revenue metrics",
    tags: ["Metrics"],
  }),
);

app.get(
  "/expenses",
  describeRoute({
    description: "Get expenses metrics",
    tags: ["Metrics"],
  }),
);

app.get(
  "/profit",
  describeRoute({
    description: "Get profit metrics",
    tags: ["Metrics"],
  }),
);

app.get(
  "/burn-rate",
  describeRoute({
    description: "Get burn rate metrics",
    tags: ["Metrics"],
  }),
);

app.get(
  "/spending",
  describeRoute({
    description: "Get spending metrics",
    tags: ["Metrics"],
  }),
);

export const metricsRouter = app;
