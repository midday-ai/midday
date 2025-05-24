import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

const app = new Hono();

app.get(
  "/",
  describeRoute({
    description: "Search for documents",
    tags: ["Search"],
  }),
);

export const searchRouter = app;
