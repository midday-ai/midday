import type { Context } from "@api/rest/types";
import {
  createTransactionSchema,
  createTransactionsResponseSchema,
  createTransactionsSchema,
  deleteTransactionResponseSchema,
  deleteTransactionSchema,
  deleteTransactionsResponseSchema,
  deleteTransactionsSchema,
  getTransactionByIdSchema,
  getTransactionsSchema,
  transactionResponseSchema,
  transactionsResponseSchema,
  updateTransactionSchema,
  updateTransactionsSchema,
} from "@api/schemas/transactions";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  createTransaction,
  createTransactions,
  deleteTransactions,
  getTransactionById,
  getTransactions,
  updateTransaction,
  updateTransactions,
} from "@midday/db/queries";
import { withRequiredScope } from "../middleware";

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "List all transactions",
    operationId: "listTransactions",
    "x-speakeasy-name-override": "list",
    description: "Retrieve a list of transactions for the authenticated team.",
    tags: ["Transactions"],
    request: {
      query: getTransactionsSchema,
    },
    responses: {
      200: {
        description:
          "Retrieve a list of transactions for the authenticated team.",
        content: {
          "application/json": {
            schema: transactionsResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("transactions.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const query = c.req.valid("query");

    const data = await getTransactions(db, {
      teamId,
      ...query,
    });

    return c.json(validateResponse(data, transactionsResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/{id}",
    summary: "Retrieve a transaction",
    operationId: "getTransactionById",
    "x-speakeasy-name-override": "get",
    description: "Retrieve a transaction by its ID for the authenticated team.",
    tags: ["Transactions"],
    request: {
      params: getTransactionByIdSchema.pick({ id: true }),
    },
    responses: {
      200: {
        description: "Transaction details",
        content: {
          "application/json": {
            schema: transactionResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("transactions.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { id } = c.req.valid("param");

    const result = await getTransactionById(db, { id, teamId });

    return c.json(validateResponse(result, transactionResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "Create a transaction",
    operationId: "createTransaction",
    "x-speakeasy-name-override": "create",
    description: "Create a transaction",
    tags: ["Transactions"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: createTransactionSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Transaction created",
        content: { "application/json": { schema: transactionResponseSchema } },
      },
    },
    middleware: [withRequiredScope("transactions.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const params = c.req.valid("json");

    const result = await createTransaction(db, { teamId, ...params });

    return c.json(validateResponse(result, transactionResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "patch",
    path: "/{id}",
    summary: "Update a transaction",
    operationId: "updateTransaction",
    "x-speakeasy-name-override": "update",
    description:
      "Update a transaction for the authenticated team. If there's no change, returns it as it is.",
    tags: ["Transactions"],
    request: {
      params: getTransactionByIdSchema.pick({ id: true }),
      body: {
        content: {
          "application/json": {
            schema: updateTransactionSchema.omit({ id: true }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Transaction updated",
        content: {
          "application/json": {
            schema: transactionResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("transactions.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { id } = c.req.valid("param");
    const params = c.req.valid("json");

    const result = await updateTransaction(db, { teamId, id, ...params });

    return c.json(validateResponse(result, transactionResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "patch",
    path: "/bulk",
    summary: "Bulk update transactions",
    operationId: "updateTransactions",
    "x-speakeasy-name-override": "updateMany",
    description:
      "Bulk update transactions for the authenticated team. If there's no change, returns it as it is.",
    tags: ["Transactions"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: updateTransactionsSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Transactions updated",
        content: {
          "application/json": {
            schema: transactionsResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("transactions.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const params = c.req.valid("json");

    const result = await updateTransactions(db, { teamId, ...params });

    return c.json(validateResponse(result, transactionsResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/bulk",
    summary: "Bulk create transactions",
    operationId: "createTransactions",
    "x-speakeasy-name-override": "createMany",
    description: "Bulk create transactions for the authenticated team.",
    tags: ["Transactions"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: createTransactionsSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Transactions created",
        content: {
          "application/json": {
            schema: createTransactionsResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("transactions.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const params = c.req.valid("json");

    const data = params.map((item) => ({ ...item, teamId }));
    const result = await createTransactions(db, data);

    return c.json(validateResponse(result, createTransactionsResponseSchema));
  },
);

// app.post(
//   "/:id/attachments",
//   describeRoute({
//     description: "Upload an attachment to a transaction",
//     tags: ["Transactions"],
//   }),
// );

// NOTE: This endpoint needs to be registred before :id delete
app.openapi(
  createRoute({
    method: "delete",
    path: "/bulk",
    summary: "Bulk delete transactions",
    operationId: "deleteTransactions",
    "x-speakeasy-name-override": "deleteMany",
    description:
      "Bulk delete transactions for the authenticated team. Only manually created transactions can be deleted via this endpoint or the form. Transactions inserted by bank connections cannot be deleted, but can be excluded by updating the status.",
    tags: ["Transactions"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: deleteTransactionsSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Transactions deleted",
        content: {
          "application/json": {
            schema: deleteTransactionsResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("transactions.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const params = c.req.valid("json");

    const result = await deleteTransactions(db, {
      teamId,
      ids: params,
    });

    return c.json(validateResponse(result, deleteTransactionsResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
    summary: "Delete a transaction",
    operationId: "deleteTransaction",
    "x-speakeasy-name-override": "delete",
    description:
      "Delete a transaction for the authenticated team. Only manually created transactions can be deleted via this endpoint or the form. Transactions inserted by bank connections cannot be deleted, but can be excluded by updating the status.",
    tags: ["Transactions"],
    request: {
      params: deleteTransactionSchema,
    },
    responses: {
      200: {
        description: "Transaction deleted",
        content: {
          "application/json": {
            schema: deleteTransactionResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("transactions.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { id } = c.req.valid("param");

    const [result] = await deleteTransactions(db, { teamId, ids: [id] });

    return c.json(validateResponse(result, deleteTransactionResponseSchema));
  },
);

export const transactionsRouter = app;
