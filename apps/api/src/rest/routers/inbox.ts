import type { Context } from "@api/rest/types";
import {
  deleteInboxResponseSchema,
  deleteInboxSchema,
  getInboxByIdSchema,
  getInboxSchema,
  inboxItemResponseSchema,
  inboxResponseSchema,
  updateInboxSchema,
} from "@api/schemas/inbox";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  deleteInbox,
  getInbox,
  getInboxById,
  updateInbox,
} from "@midday/db/queries";
import { withRequiredScope } from "../middleware";

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "List all inbox items",
    operationId: "listInboxItems",
    "x-speakeasy-name-override": "list",
    description: "Retrieve a list of inbox items for the authenticated team.",
    tags: ["Inbox"],
    request: {
      query: getInboxSchema,
    },
    responses: {
      200: {
        description:
          "Retrieve a list of inbox items for the authenticated team.",
        content: {
          "application/json": {
            schema: inboxResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("inbox.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { pageSize, cursor, order, ...filter } = c.req.valid("query");

    const result = await getInbox(db, {
      teamId,
      pageSize,
      cursor,
      order,
      ...filter,
    });

    return c.json(validateResponse(result, inboxResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/{id}",
    summary: "Retrieve a inbox item",
    operationId: "getInboxItemById",
    "x-speakeasy-name-override": "get",
    description:
      "Retrieve a inbox item by its unique identifier for the authenticated team.",
    tags: ["Inbox"],
    request: {
      params: getInboxByIdSchema.pick({ id: true }),
    },
    responses: {
      200: {
        description: "Retrieve an inbox item by its ID.",
        content: {
          "application/json": {
            schema: inboxItemResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("inbox.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { id } = c.req.valid("param");

    const result = await getInboxById(db, {
      id,
      teamId,
    });

    return c.json(validateResponse(result, inboxItemResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
    summary: "Delete a inbox item",
    operationId: "deleteInboxItem",
    "x-speakeasy-name-override": "delete",
    description:
      "Delete a inbox item by its unique identifier for the authenticated team.",
    tags: ["Inbox"],
    request: {
      params: deleteInboxSchema.pick({ id: true }),
    },
    responses: {
      200: {
        description: "Delete a inbox item by its ID.",
        content: {
          "application/json": {
            schema: deleteInboxResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("inbox.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { id } = c.req.valid("param");

    const result = await deleteInbox(db, {
      id,
      teamId,
    });

    return c.json(validateResponse(result, deleteInboxResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "patch",
    path: "/{id}",
    summary: "Update a inbox item",
    operationId: "updateInboxItem",
    "x-speakeasy-name-override": "update",
    description:
      "Update fields of an inbox item by its unique identifier for the authenticated team.",
    tags: ["Inbox"],
    request: {
      params: updateInboxSchema.pick({ id: true }),
      body: {
        content: {
          "application/json": {
            schema: updateInboxSchema.omit({ id: true }),
          },
        },
        required: true,
      },
    },
    responses: {
      200: {
        description:
          "Update fields of an inbox item by its unique identifier for the authenticated team.",
        content: {
          "application/json": {
            schema: inboxItemResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("inbox.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const id = c.req.valid("param").id;
    const body = c.req.valid("json");

    const result = await updateInbox(db, { ...body, id, teamId });

    return c.json(validateResponse(result, inboxItemResponseSchema));
  },
);

export const inboxRouter = app;
