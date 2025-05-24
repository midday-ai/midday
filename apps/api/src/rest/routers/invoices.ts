import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

const app = new Hono();

app.get(
  "/",
  describeRoute({
    description: "Say hello to the user",
    tags: ["Invoices"],
  }),
);

app.post(
  "/",
  describeRoute({
    description: "Create a new invoice",
    tags: ["Invoices"],
  }),
);

app.get(
  "/:id",
  describeRoute({
    description: "Get an invoice by ID",
    tags: ["Invoices"],
  }),
);

app.put(
  "/:id",
  describeRoute({
    description: "Update an invoice by ID",
    tags: ["Invoices"],
  }),
);

app.delete(
  "/:id",
  describeRoute({
    description: "Delete an invoice by ID",
    tags: ["Invoices"],
  }),
);

export const invoicesRouter = app;
