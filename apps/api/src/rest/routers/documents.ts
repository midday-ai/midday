import type { Context } from "@api/rest/types";
import {
  deleteDocumentResponseSchema,
  deleteDocumentSchema,
  documentResponseSchema,
  documentsResponseSchema,
  getDocumentPreSignedUrlSchema,
  getDocumentSchema,
  getDocumentsSchema,
  preSignedUrlResponseSchema,
} from "@api/schemas/documents";
import { createClient } from "@api/services/supabase";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import {
  deleteDocument,
  getDocumentById,
  getDocuments,
} from "@midday/db/queries";
import { signedUrl } from "@midday/supabase/storage";
import { withRequiredScope } from "../middleware";

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "List all documents",
    operationId: "listDocuments",
    "x-speakeasy-name-override": "list",
    description: "Retrieve a list of documents for the authenticated team.",
    tags: ["Documents"],
    request: {
      query: getDocumentsSchema,
    },
    responses: {
      200: {
        description: "Retrieve a list of documents for the authenticated team.",
        content: {
          "application/json": {
            schema: documentsResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("documents.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { pageSize, cursor, sort, ...filter } = c.req.valid("query");

    const result = await getDocuments(db, {
      teamId,
      pageSize,
      cursor,
      ...filter,
    });

    return c.json(validateResponse(result, documentsResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/{id}",
    summary: "Retrieve a document",
    operationId: "getDocumentById",
    "x-speakeasy-name-override": "get",
    description:
      "Retrieve a document by its unique identifier for the authenticated team.",
    tags: ["Documents"],
    request: {
      params: getDocumentSchema.pick({ id: true }),
    },
    responses: {
      200: {
        description: "Retrieve a document by its unique identifier",
        content: {
          "application/json": {
            schema: documentResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("documents.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const id = c.req.valid("param").id;

    const result = await getDocumentById(db, {
      teamId,
      id,
    });

    return c.json(validateResponse(result, documentResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/{id}/presigned-url",
    summary: "Generate pre-signed URL for document",
    operationId: "getDocumentPreSignedUrl",
    "x-speakeasy-name-override": "getPreSignedUrl",
    description:
      "Generate a pre-signed URL for accessing a document. The URL is valid for 60 seconds and allows secure temporary access to the document file.",
    tags: ["Documents"],
    request: {
      params: getDocumentPreSignedUrlSchema,
    },
    responses: {
      200: {
        description: "Pre-signed URL generated successfully",
        content: {
          "application/json": {
            schema: preSignedUrlResponseSchema,
          },
        },
      },
      400: {
        description: "Bad request - Document file path not available",
        content: {
          "application/json": {
            schema: z.object({
              error: z.string(),
            }),
          },
        },
      },
      404: {
        description: "Document not found",
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
    middleware: [withRequiredScope("documents.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const session = c.get("session");
    const teamId = c.get("teamId");
    const { id } = c.req.valid("param");

    // First, verify the document exists and belongs to the team
    const document = await getDocumentById(db, {
      id,
      teamId,
    });

    if (!document) {
      return c.json({ error: "Document not found" }, 404);
    }

    if (!document.pathTokens || document.pathTokens.length === 0) {
      return c.json({ error: "Document file path not available" }, 400);
    }

    // Create supabase client with the user's access token
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const supabase = await createClient(accessToken);

    // Generate the pre-signed URL with 60-second expiration
    const filePath = document.pathTokens.join("/");
    const expireIn = 60; // 60 seconds

    const { data, error } = await signedUrl(supabase, {
      bucket: "vault",
      path: filePath,
      expireIn,
      options: {
        download: true,
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
      fileName: document.name,
    };

    return c.json(validateResponse(result, preSignedUrlResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
    summary: "Delete a document",
    operationId: "deleteDocument",
    "x-speakeasy-name-override": "delete",
    description:
      "Delete a document by its unique identifier for the authenticated team.",
    tags: ["Documents"],
    request: {
      params: deleteDocumentSchema,
    },
    responses: {
      200: {
        description: "Document deleted successfully",
        content: {
          "application/json": {
            schema: deleteDocumentResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("documents.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const id = c.req.valid("param").id;

    const result = await deleteDocument(db, { teamId, id });

    return c.json(validateResponse(result, documentResponseSchema));
  },
);

export const documentsRouter = app;
