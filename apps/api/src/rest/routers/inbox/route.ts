import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

const app = new Hono();

app.get(
  "/",
  describeRoute({
    description: "Get inbox",
    tags: ["Inbox"],
  }),
);

app.post(
  "/",
  describeRoute({
    description: "Upload new document to inbox",
    tags: ["Inbox"],
  }),
);

app.get(
  "/:id",
  describeRoute({
    description: "Get inbox by ID",
    tags: ["Inbox"],
  }),
);

app.put(
  "/:id",
  describeRoute({
    description: "Update inbox by ID",
    tags: ["Inbox"],
  }),
);

app.delete(
  "/:id",
  describeRoute({
    description: "Delete inbox by ID",
    tags: ["Inbox"],
  }),
);

export const inboxRouter = app;
