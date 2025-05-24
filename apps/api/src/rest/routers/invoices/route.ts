import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { querySchema, responseSchema } from "./schema";

const app = new Hono();

app.get(
  "/",
  describeRoute({
    description: "Say hello to the user",
    tags: ["Invoices"],
    responses: {
      200: {
        description: "Successful greeting response",
        content: {
          "text/plain": {
            schema: resolver(responseSchema),
          },
        },
      },
    },
  }),
  zValidator("query", querySchema),
  (c) => {
    const query = c.req.valid("query");
    return c.text(`Hello ${query?.name ?? "Hono"}!`);
  },
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
