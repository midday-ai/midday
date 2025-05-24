import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

const app = new Hono();

app.get(
  "/",
  describeRoute({
    description: "Get tracker",
    tags: ["Tracker"],
  }),
);

export const trackerRouter = app;
