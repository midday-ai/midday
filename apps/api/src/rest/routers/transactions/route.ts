import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { transactionsQuerySchema, transactionsResponseSchema } from "./schema";

const app = new Hono();

app.get(
  "/",
  describeRoute({
    description: "Say hello to the user",
    tags: ["Transactions"],
    responses: {
      200: {
        description: "Successful greeting response",
        content: {
          "text/plain": {
            schema: resolver(transactionsResponseSchema),
          },
        },
      },
    },
  }),
  zValidator("query", transactionsQuerySchema),
  (c) => {
    const query = c.req.valid("query");
    return c.json({
      message: "Hello World",
    });
  },
);

app.get(
  "/tags",
  describeRoute({
    description: "Get tags",
    tags: ["Transactions"],
  }),
  (c) => {
    return c.json({
      message: "Hello World",
    });
  },
);

app.get(
  "/categories",
  describeRoute({
    description: "Get categories",
    tags: ["Transactions"],
  }),
);

app.post(
  "/",
  describeRoute({
    description: "Create a new transaction",
    tags: ["Transactions"],
  }),
);

app.post(
  "/bulk",
  describeRoute({
    description: "Create multiple transactions",
    tags: ["Transactions"],
  }),
);

app.post(
  "/:id/attachments",
  describeRoute({
    description: "Upload an attachment to a transaction",
    tags: ["Transactions"],
  }),
);

app.get(
  "/:id",
  describeRoute({
    description: "Get a transaction by ID",
    tags: ["Transactions"],
  }),
);

app.put(
  "/:id",
  describeRoute({
    description: "Update a transaction by ID",
    tags: ["Transactions"],
  }),
);

app.delete(
  "/:id",
  describeRoute({
    description: "Delete a transaction by ID",
    tags: ["Transactions"],
  }),
);

export const transactionsRouter = app;
