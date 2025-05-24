import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

const app = new Hono();

app.get(
  "/",
  describeRoute({
    description: "Get accounts",
    tags: ["Accounts"],
  }),
);

app.post(
  "/",
  describeRoute({
    description: "Create account",
    tags: ["Accounts"],
  }),
);

app.get(
  "/:id",
  describeRoute({
    description: "Get account by ID",
    tags: ["Accounts"],
  }),
);

app.post(
  "/:id/balance",
  describeRoute({
    description: "Get account balance",
    tags: ["Accounts"],
  }),
);

app.put(
  "/:id",
  describeRoute({
    description: "Update account by ID",
    tags: ["Accounts"],
  }),
);

app.delete(
  "/:id",
  describeRoute({
    description: "Delete account by ID",
    tags: ["Accounts"],
  }),
);

export const accountsRouter = app;
