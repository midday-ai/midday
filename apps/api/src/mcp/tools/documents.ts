import { getDocumentsSchema } from "@api/schemas/documents";
import { getDocumentById, getDocuments } from "@midday/db/queries";
import { z } from "zod";
import { mcpDocumentSchema, sanitize, sanitizeArray } from "../schemas";
import { hasScope, READ_ONLY_ANNOTATIONS, type RegisterTools } from "../types";
import {
  downloadVaultFile,
  getMimeType,
  getVaultSignedUrl,
  type McpContent,
  truncateListResponse,
} from "../utils";

export const registerDocumentTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  if (!hasScope(ctx, "documents.read")) {
    return;
  }

  const { sort: _sort, ...documentsListFields } = getDocumentsSchema.shape;

  server.registerTool(
    "documents_list",
    {
      title: "List Documents",
      description:
        "List documents and files stored in the vault. Supports free-text search and tag filtering. Returns paginated results (default 25) with document name, type, size, and creation date.",
      inputSchema: documentsListFields,
      outputSchema: {
        meta: z.looseObject({
          cursor: z.string().nullable().optional(),
          hasNextPage: z.boolean(),
          hasPreviousPage: z.boolean(),
        }),
        data: z.array(z.record(z.string(), z.any())),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params) => {
      const result = await getDocuments(db, {
        teamId,
        cursor: params.cursor ?? null,
        pageSize: params.pageSize ?? 25,
        q: params.q ?? null,
        tags: params.tags ?? null,
      });

      const response = {
        meta: {
          cursor: result.meta.cursor ?? null,
          hasNextPage: result.meta.hasNextPage,
          hasPreviousPage: result.meta.hasPreviousPage,
        },
        data: sanitizeArray(mcpDocumentSchema, result.data ?? []),
      };

      const { text, structuredContent } = truncateListResponse(response);

      return {
        content: [{ type: "text", text }],
        structuredContent,
      };
    },
  );

  server.registerTool(
    "documents_get",
    {
      title: "Get Document",
      description:
        "Get a single document by ID with metadata and a signed download URL (valid for 1 hour). Set download=true to include the actual file content as a binary resource.",
      inputSchema: {
        id: z.string().uuid().describe("Document ID"),
        download: z
          .boolean()
          .optional()
          .default(false)
          .describe("Include the file content as a downloadable resource"),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ id, download: includeFile }) => {
      const result = await getDocumentById(db, { id, teamId });

      if (!result) {
        return {
          content: [{ type: "text", text: "Document not found" }],
          isError: true,
        };
      }

      const hasFile = result.pathTokens && result.name;
      const storagePath = hasFile
        ? [teamId, ...result.pathTokens!, result.name!].join("/")
        : null;

      const fileUrl = storagePath ? await getVaultSignedUrl(storagePath) : null;

      const clean = sanitize(mcpDocumentSchema, { ...result, fileUrl });

      const content: McpContent[] = [
        {
          type: "text",
          text: JSON.stringify(clean),
        },
      ];

      if (includeFile && storagePath && fileUrl) {
        try {
          const resource = await downloadVaultFile(
            storagePath,
            fileUrl,
            getMimeType(result.name!),
          );
          if (resource) content.push(resource);
        } catch {
          content.push({
            type: "text",
            text: "Failed to download file from storage",
          });
        }
      }

      return { content };
    },
  );
};
