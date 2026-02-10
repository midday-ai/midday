import type { Context } from "@api/rest/types";
import {
  createTransactionSchema,
  createTransactionsResponseSchema,
  createTransactionsSchema,
  deleteTransactionResponseSchema,
  deleteTransactionSchema,
  deleteTransactionsResponseSchema,
  deleteTransactionsSchema,
  getTransactionAttachmentPreSignedUrlSchema,
  getTransactionByIdSchema,
  getTransactionsSchema,
  transactionAttachmentPreSignedUrlResponseSchema,
  transactionResponseSchema,
  transactionsResponseSchema,
  updateTransactionSchema,
  updateTransactionsSchema,
} from "@api/schemas/transactions";
import { createAdminClient } from "@api/services/supabase";
import { validateResponse } from "@api/utils/validate-response";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  createTransaction,
  createTransactions,
  deleteTransactions,
  getTransactionAttachment,
  getTransactionById,
  getTransactions,
  updateTransaction,
  updateTransactions,
} from "@midday/db/queries";
import { signedUrl } from "@midday/supabase/storage";
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
    path: "/{transactionId}/attachments/{attachmentId}/presigned-url",
    summary: "Generate pre-signed URL for transaction attachment",
    operationId: "getTransactionAttachmentPreSignedUrl",
    "x-speakeasy-name-override": "getAttachmentPreSignedUrl",
    description:
      "Generate a pre-signed URL for accessing a transaction attachment. The URL is valid for 60 seconds and allows secure temporary access to the attachment file.",
    tags: ["Transactions"],
    request: {
      params: getTransactionAttachmentPreSignedUrlSchema.pick({
        transactionId: true,
        attachmentId: true,
      }),
      query: getTransactionAttachmentPreSignedUrlSchema.pick({
        download: true,
      }),
    },
    responses: {
      200: {
        description: "Pre-signed URL generated successfully",
        content: {
          "application/json": {
            schema: transactionAttachmentPreSignedUrlResponseSchema,
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
        description: "Transaction or attachment not found",
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
    middleware: [withRequiredScope("transactions.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { transactionId, attachmentId } = c.req.valid("param");
    const { download = true } = c.req.valid("query");

    // First, verify the attachment exists and belongs to the team/transaction
    const attachment = await getTransactionAttachment(db, {
      transactionId,
      attachmentId,
      teamId,
    });

    if (!attachment) {
      return c.json({ error: "Transaction attachment not found" }, 404);
    }

    if (!attachment.path || attachment.path.length === 0) {
      return c.json({ error: "Attachment file path not available" }, 400);
    }

    // Create admin supabase client
    const supabase = await createAdminClient();

    // Generate the pre-signed URL with 60-second expiration
    const filePath = attachment.path.join("/");
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
      fileName: attachment.name || attachment.path.at(-1) || null,
    };

    return c.json(
      validateResponse(result, transactionAttachmentPreSignedUrlResponseSchema),
      200,
    );
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
    const userId = c.get("session").user.id;
    const { id } = c.req.valid("param");
    const params = c.req.valid("json");

    const result = await updateTransaction(db, {
      teamId,
      id,
      userId,
      ...params,
    });

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
    const userId = c.get("session").user.id;
    const params = c.req.valid("json");

    const result = await updateTransactions(db, {
      teamId,
      userId,
      ...params,
    });

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

// NOTE: This endpoint needs to be registered before :id delete
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
