import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

const app = new Hono();

app.get(
  "/",
  describeRoute({
    description: "Get tags",
    tags: ["Tags"],
  }),
);

app.post(
  "/",
  describeRoute({
    description: "Create a new tag",
    tags: ["Tags"],
  }),
);

app.put(
  "/:id",
  describeRoute({
    description: "Update a tag",
    tags: ["Tags"],
  }),
);

app.delete(
  "/:id",
  describeRoute({
    description: "Delete a tag",
    tags: ["Tags"],
  }),
);

export const tagsRouter = app;
