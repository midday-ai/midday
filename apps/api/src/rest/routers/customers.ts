import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

const app = new Hono();

app.get(
  "/",
  describeRoute({
    description: "Get customers",
    tags: ["Customers"],
  }),
);

app.post(
  "/",
  describeRoute({
    description: "Create customer",
    tags: ["Customers"],
  }),
);

app.get(
  "/:id",
  describeRoute({
    description: "Get customer by ID",
    tags: ["Customers"],
  }),
);

app.put(
  "/:id",
  describeRoute({
    description: "Update customer by ID",
    tags: ["Customers"],
  }),
);

app.delete(
  "/:id",
  describeRoute({
    description: "Delete customer by ID",
    tags: ["Customers"],
  }),
);

export const customersRouter = app;
