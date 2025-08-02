import type { Context } from "@api/rest/types";
import {
  deleteDocumentResponseSchema,
  deleteDocumentSchema,
  documentResponseSchema,
  documentsResponseSchema,
  getDocumentSchema,
  getDocumentsSchema,
} from "@api/schemas/documents";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  deleteDocument,
  getDocumentById,
  getDocuments,
} from "@midday/db/queries";
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
