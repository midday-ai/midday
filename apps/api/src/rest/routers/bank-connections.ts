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

export const bankConnectionsRouter = app;
