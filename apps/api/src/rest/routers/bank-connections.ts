import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

const app = new Hono();

app.get(
  "/",
  describeRoute({
    description: "Get bank connections",
    tags: ["Bank Connections"],
    responses: {
      200: {
        description: "List of bank connections",
        content: {
          "application/json": {
            schema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  provider: { type: "string" },
                  institutionId: { type: "string" },
                  institutionName: { type: "string" },
                  status: {
                    type: "string",
                    enum: ["connected", "disconnected", "unknown"],
                  },
                  lastSync: { type: "string", format: "date-time" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
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
    description: "Create bank connection",
    tags: ["Bank Connections"],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["provider", "institutionId"],
            properties: {
              provider: {
                type: "string",
                enum: ["plaid", "teller", "gocardless"],
              },
              institutionId: { type: "string" },
              accessToken: { type: "string" },
              enrollmentId: { type: "string" },
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: "Bank connection created",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: { type: "string" },
                provider: { type: "string" },
                institutionId: { type: "string" },
                institutionName: { type: "string" },
                status: { type: "string" },
                createdAt: { type: "string", format: "date-time" },
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
    description: "Get bank connection by ID",
    tags: ["Bank Connections"],
    responses: {
      200: {
        description: "Bank connection details",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: { type: "string" },
                provider: { type: "string" },
                institutionId: { type: "string" },
                institutionName: { type: "string" },
                status: { type: "string" },
                lastSync: { type: "string", format: "date-time" },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" },
                accounts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      type: { type: "string" },
                      currency: { type: "string" },
                    },
                  },
                },
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
    description: "Update bank connection",
    tags: ["Bank Connections"],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["connected", "disconnected"],
              },
              accessToken: { type: "string" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Bank connection updated",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: { type: "string" },
                provider: { type: "string" },
                institutionId: { type: "string" },
                status: { type: "string" },
                updatedAt: { type: "string", format: "date-time" },
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
    description: "Delete bank connection",
    tags: ["Bank Connections"],
    responses: {
      200: {
        description: "Bank connection deleted",
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

app.post(
  "/:id/sync",
  describeRoute({
    description: "Trigger manual sync for bank connection",
    tags: ["Bank Connections"],
    responses: {
      200: {
        description: "Sync triggered",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                syncId: { type: "string" },
              },
            },
          },
        },
      },
    },
  }),
);

export const bankConnectionsRouter = app;
