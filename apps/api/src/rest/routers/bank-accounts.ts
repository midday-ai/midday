import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

const app = new Hono();

app.get(
  "/",
  describeRoute({
    description: "Get bank accounts",
    tags: ["Bank Accounts"],
    responses: {
      200: {
        description: "List of bank accounts",
        content: {
          "application/json": {
            schema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  currency: { type: "string" },
                  type: { type: "string" },
                  enabled: { type: "boolean" },
                  balance: { type: "number" },
                  manual: { type: "boolean" },
                },
              },
            },
          },
        },
      },
    },
  }),
);

app.post(
  "/",
  describeRoute({
    description: "Create bank account",
    tags: ["Bank Accounts"],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name", "currency"],
            properties: {
              name: { type: "string" },
              currency: { type: "string" },
              type: { type: "string" },
              balance: { type: "number" },
              manual: { type: "boolean" },
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: "Bank account created",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                currency: { type: "string" },
                type: { type: "string" },
                enabled: { type: "boolean" },
                balance: { type: "number" },
                manual: { type: "boolean" },
              },
            },
          },
        },
      },
    },
  }),
);

app.get(
  "/balances",
  describeRoute({
    description: "Get bank account balances",
    tags: ["Bank Accounts"],
    responses: {
      200: {
        description: "Account balances",
        content: {
          "application/json": {
            schema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  accountId: { type: "string" },
                  currency: { type: "string" },
                  balance: { type: "number" },
                },
              },
            },
          },
        },
      },
    },
  }),
);

app.get(
  "/currencies",
  describeRoute({
    description: "Get supported currencies",
    tags: ["Bank Accounts"],
    responses: {
      200: {
        description: "List of supported currencies",
        content: {
          "application/json": {
            schema: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
        },
      },
    },
  }),
);

app.get(
  "/:id",
  describeRoute({
    description: "Get bank account by ID",
    tags: ["Bank Accounts"],
    responses: {
      200: {
        description: "Bank account details",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                currency: { type: "string" },
                type: { type: "string" },
                enabled: { type: "boolean" },
                balance: { type: "number" },
                manual: { type: "boolean" },
              },
            },
          },
        },
      },
    },
  }),
);

app.put(
  "/:id",
  describeRoute({
    description: "Update bank account by ID",
    tags: ["Bank Accounts"],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              enabled: { type: "boolean" },
              type: { type: "string" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Bank account updated",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                currency: { type: "string" },
                type: { type: "string" },
                enabled: { type: "boolean" },
                balance: { type: "number" },
                manual: { type: "boolean" },
              },
            },
          },
        },
      },
    },
  }),
);

app.delete(
  "/:id",
  describeRoute({
    description: "Delete bank account by ID",
    tags: ["Bank Accounts"],
    responses: {
      200: {
        description: "Bank account deleted",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
              },
            },
          },
        },
      },
    },
  }),
);

export const bankAccountsRouter = app;
