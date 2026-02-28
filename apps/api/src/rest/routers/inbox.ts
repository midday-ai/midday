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
  uploadInboxItemResponseSchema,
} from "@api/schemas/inbox";
import { createAdminClient } from "@api/services/supabase";
import { validateResponse } from "@api/utils/validate-response";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  createInbox,
  deleteInbox,
  getInbox,
  getInboxById,
  updateInbox,
} from "@midday/db/queries";
import { isMimeTypeSupportedForProcessing } from "@midday/documents/utils";
import { triggerJob } from "@midday/job-client";
import { logger } from "@midday/logger";
import { signedUrl } from "@midday/supabase/storage";
import { nanoid } from "nanoid";
import { withRequiredScope } from "../middleware";
import { generateUniqueFileName } from "./webhooks/inbox/utils";

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

const MAX_UPLOAD_SIZE = 20 * 1024 * 1024; // 20MB

app.openapi(
  createRoute({
    method: "post",
    path: "/upload",
    summary: "Upload a document to inbox",
    operationId: "uploadInboxItem",
    "x-speakeasy-name-override": "upload",
    description:
      "Upload a document (invoice, receipt, etc.) to the inbox via multipart form data. " +
      "The file will be stored and automatically processed (OCR, classification, transaction matching). " +
      "Accepts optional metadata fields (currency, amount) as additional form fields.",
    tags: ["Inbox"],
    request: {
      body: {
        content: {
          "multipart/form-data": {
            schema: z.object({
              file: z.any().openapi({
                type: "string",
                format: "binary",
                description: "The document file to upload (PDF, image, etc.)",
              }),
              currency: z.string().length(3).optional().openapi({
                description: "ISO 4217 currency code",
                example: "USD",
              }),
              amount: z.coerce.number().optional().openapi({
                description: "Known amount for the document",
                example: 150.0,
              }),
            }),
          },
        },
        required: true,
      },
    },
    responses: {
      201: {
        description: "Document uploaded and processing started",
        content: {
          "application/json": {
            schema: uploadInboxItemResponseSchema,
          },
        },
      },
      400: {
        description:
          "Bad request - missing file, unsupported type, or file too large",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
          },
        },
      },
      500: {
        description: "Internal server error - upload or processing failed",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
          },
        },
      },
    },
    middleware: [withRequiredScope("inbox.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");

    const body = await c.req.parseBody();
    const file = body.file;

    if (!file || !(file instanceof File)) {
      return c.json(
        { error: "Missing required 'file' field in multipart form data" },
        400,
      );
    }

    if (file.size === 0) {
      return c.json({ error: "Uploaded file is empty" }, 400);
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      return c.json(
        {
          error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (20MB)`,
        },
        400,
      );
    }

    const mimetype = file.type || "application/octet-stream";

    if (
      mimetype !== "application/octet-stream" &&
      !isMimeTypeSupportedForProcessing(mimetype)
    ) {
      return c.json({ error: `Unsupported file type: ${mimetype}` }, 400);
    }

    const uniqueFileName = generateUniqueFileName(file.name, mimetype);
    const filePath = [teamId, "inbox", uniqueFileName];
    const filePathStr = filePath.join("/");

    const supabase = await createAdminClient();

    const arrayBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("vault")
      .upload(filePathStr, new Uint8Array(arrayBuffer), {
        contentType: mimetype,
        upsert: true,
      });

    if (uploadError || !uploadData) {
      logger.error("Failed to upload file to storage", {
        error: uploadError?.message,
        filePath: filePathStr,
        teamId,
      });
      return c.json({ error: "Failed to upload file to storage" }, 500);
    }

    const referenceId = `api_upload_${nanoid(12)}`;

    const currency =
      typeof body.currency === "string" && body.currency.length === 3
        ? body.currency.toUpperCase()
        : undefined;
    const amount =
      typeof body.amount === "string" && !Number.isNaN(Number(body.amount))
        ? Number(body.amount)
        : undefined;

    const inboxData = await createInbox(db, {
      displayName: file.name,
      teamId,
      filePath,
      fileName: uniqueFileName,
      contentType: mimetype,
      size: file.size,
      referenceId,
      meta: { source: "api" },
      status: "processing",
    });

    if (!inboxData) {
      return c.json({ error: "Failed to create inbox item" }, 500);
    }

    if (currency || amount) {
      await updateInbox(db, {
        id: inboxData.id,
        teamId,
        ...(currency && { currency }),
        ...(amount && { amount }),
      });
    }

    try {
      await triggerJob(
        "process-attachment",
        {
          filePath,
          mimetype,
          size: file.size,
          teamId,
          referenceId,
        },
        "extraction",
        { priority: 1 },
      );
    } catch (error) {
      logger.error("Failed to trigger process-attachment job", {
        inboxId: inboxData.id,
        teamId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    try {
      await triggerJob(
        "notification",
        {
          type: "inbox_new",
          teamId,
          totalCount: 1,
          inboxType: "api",
        },
        "notifications",
      );
    } catch {
      // Non-critical
    }

    const result = {
      id: inboxData.id,
      fileName: uniqueFileName,
      filePath,
      status: "processing",
    };

    return c.json(validateResponse(result, uploadInboxItemResponseSchema), 201);
  },
);

export const inboxRouter = app;
