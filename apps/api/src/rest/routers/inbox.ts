import type { Context } from "@api/rest/types";
import {
  deleteInboxResponseSchema,
  deleteInboxSchema,
  getInboxByIdSchema,
  getInboxPreSignedUrlSchema,
  getInboxSchema,
  inboxItemResponseSchema,
  inboxPreSignedUrlResponseSchema,
  inboxResponseSchema,
  updateInboxSchema,
} from "@api/schemas/inbox";
import { createAdminClient } from "@api/services/supabase";
import { validateResponse } from "@api/utils/validate-response";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  deleteInbox,
  getInbox,
  getInboxById,
  updateInbox,
} from "@midday/db/queries";
import { signedUrl } from "@midday/supabase/storage";
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
    method: "post",
    path: "/{id}/presigned-url",
    summary: "Generate pre-signed URL for inbox attachment",
    operationId: "getInboxPreSignedUrl",
    "x-speakeasy-name-override": "getPreSignedUrl",
    description:
      "Generate a pre-signed URL for accessing an inbox attachment. The URL is valid for 60 seconds and allows secure temporary access to the attachment file.",
    tags: ["Inbox"],
    request: {
      params: getInboxPreSignedUrlSchema.pick({ id: true }),
      query: getInboxPreSignedUrlSchema.pick({ download: true }),
    },
    responses: {
      200: {
        description: "Pre-signed URL generated successfully",
        content: {
          "application/json": {
            schema: inboxPreSignedUrlResponseSchema,
          },
        },
      },
      400: {
        description: "Bad request - Attachment file path not available",
        content: {
          "application/json": {
            schema: z.object({
              error: z.string(),
            }),
          },
        },
      },
      404: {
        description: "Inbox item not found",
        content: {
          "application/json": {
            schema: z.object({
              error: z.string(),
            }),
          },
        },
      },
      500: {
        description:
          "Internal server error - Failed to generate pre-signed URL",
        content: {
          "application/json": {
            schema: z.object({
              error: z.string(),
            }),
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
    const { download = true } = c.req.valid("query");

    // First, verify the inbox item exists and belongs to the team
    const inboxItem = await getInboxById(db, {
      id,
      teamId,
    });

    if (!inboxItem) {
      return c.json({ error: "Inbox item not found" }, 404);
    }

    if (!inboxItem.filePath || inboxItem.filePath.length === 0) {
      return c.json({ error: "Attachment file path not available" }, 400);
    }

    // Create admin supabase client
    const supabase = await createAdminClient();

    // Generate the pre-signed URL with 60-second expiration
    const filePath = inboxItem.filePath.join("/");
    const expireIn = 60; // 60 seconds

    const { data, error } = await signedUrl(supabase, {
      bucket: "vault",
      path: filePath,
      expireIn,
      options: {
        download,
      },
    });

    if (error || !data?.signedUrl) {
      return c.json({ error: "Failed to generate pre-signed URL" }, 500);
    }

    // Calculate expiration timestamp
    const expiresAt = new Date(Date.now() + expireIn * 1000).toISOString();

    const result = {
      url: data.signedUrl,
      expiresAt,
      fileName: inboxItem.fileName || inboxItem.filePath.at(-1) || null,
    };

    return c.json(
      validateResponse(result, inboxPreSignedUrlResponseSchema),
      200,
    );
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
