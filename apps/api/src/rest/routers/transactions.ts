import { getTransactions } from "@api/db/queries/transactions";
import type { Context } from "@api/rest/types";
import {
  getTransactionsSchema,
  transactionsSchema,
} from "@api/schemas/transactions";
import { withTransform } from "@api/utils/with-transform";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

const app = new Hono<Context>();

app.get(
  "/",
  describeRoute({
    description: "Get transactions",
    tags: ["Transactions"],
    responses: {
      200: {
        description: "Transactions",
        content: {
          "application/json": {
            schema: resolver(transactionsSchema.snake),
          },
        },
      },
    },
  }),
  zValidator("query", getTransactionsSchema.snake),
  withTransform(
    {
      input: getTransactionsSchema,
      output: transactionsSchema,
    },
    async (c, transformedQuery) => {
      const db = c.get("db");

      return getTransactions(db, {
        teamId: c.get("teamId"),
        ...transformedQuery,
      });
    },
  ),
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
