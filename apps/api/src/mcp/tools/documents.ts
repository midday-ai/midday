import { getDocumentsSchema } from "@api/schemas/documents";
import {
  createDocumentTag,
  createDocumentTagAssignment,
  deleteDocument,
  deleteDocumentTag,
  deleteDocumentTagAssignment,
  getDocumentById,
  getDocuments,
  getDocumentTags,
} from "@midday/db/queries";
import { z } from "zod";
import {
  mcpDocumentSchema,
  mcpDocumentTagSchema,
  sanitize,
  sanitizeArray,
} from "../schemas";
import {
  DESTRUCTIVE_ANNOTATIONS,
  hasScope,
  READ_ONLY_ANNOTATIONS,
  type RegisterTools,
  WRITE_ANNOTATIONS,
} from "../types";
import {
  downloadVaultFile,
  getMimeType,
  getVaultSignedUrl,
  type McpContent,
  truncateListResponse,
  withErrorHandling,
} from "../utils";

export const registerDocumentTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  const hasReadScope = hasScope(ctx, "documents.read");
  const hasWriteScope = hasScope(ctx, "documents.write");

  if (!hasReadScope && !hasWriteScope) {
    return;
  }

  if (hasReadScope) {
    const { sort: _sort, ...documentsListFields } = getDocumentsSchema.shape;

    server.registerTool(
      "documents_list",
      {
        title: "List Documents",
        description:
          "List documents and files stored in the vault. Supports free-text search and filtering by document tag IDs (from document_tags_list, not tags_list). Returns paginated results (default 25) with document name, type, size, and creation date.",
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
      withErrorHandling(async (params) => {
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
      }, "Failed to list documents"),
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
      withErrorHandling(async ({ id, download: includeFile }) => {
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

        const fileUrl = storagePath
          ? await getVaultSignedUrl(storagePath)
          : null;

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
      }, "Failed to get document"),
    );

    server.registerTool(
      "document_tags_list",
      {
        title: "List Document Tags",
        description:
          "List all document tags for the team. These tags are separate from transaction tags and are used to organize documents in the vault.",
        inputSchema: {},
        outputSchema: {
          data: z.array(z.record(z.string(), z.any())),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      withErrorHandling(async () => {
        const result = await getDocumentTags(db, teamId);
        const clean = sanitizeArray(mcpDocumentTagSchema, result ?? []);

        return {
          content: [{ type: "text" as const, text: JSON.stringify(clean) }],
          structuredContent: { data: clean },
        };
      }, "Failed to list document tags"),
    );
  }

  if (hasWriteScope) {
    server.registerTool(
      "documents_delete",
      {
        title: "Delete Document",
        description:
          "Permanently delete a document from the vault. Removes the file and all metadata. This action cannot be undone.",
        inputSchema: {
          id: z.string().uuid().describe("Document ID to delete"),
        },
        annotations: DESTRUCTIVE_ANNOTATIONS,
      },
      async ({ id }) => {
        try {
          const result = await deleteDocument(db, { id, teamId });

          if (!result) {
            return {
              content: [{ type: "text", text: "Document not found" }],
              isError: true,
            };
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ success: true, deletedId: result.id }),
              },
            ],
            structuredContent: { success: true, deletedId: result.id },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to delete document",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "document_tags_create",
      {
        title: "Create Document Tag",
        description:
          "Create a new document tag for organizing files in the vault. Tag names are auto-slugified.",
        inputSchema: {
          name: z.string().min(1).describe("Tag name"),
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async ({ name }) => {
        try {
          const slug = name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");

          const result = await createDocumentTag(db, { name, teamId, slug });

          if (!result) {
            return {
              content: [
                { type: "text", text: "Failed to create document tag" },
              ],
              isError: true,
            };
          }

          return {
            content: [{ type: "text", text: JSON.stringify(result) }],
            structuredContent: { data: result },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to create document tag",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "document_tags_delete",
      {
        title: "Delete Document Tag",
        description:
          "Delete a document tag. Documents that had this tag will have it removed.",
        inputSchema: {
          id: z.string().uuid().describe("Document tag ID to delete"),
        },
        annotations: DESTRUCTIVE_ANNOTATIONS,
      },
      async ({ id }) => {
        try {
          const result = await deleteDocumentTag(db, { id, teamId });

          if (!result) {
            return {
              content: [{ type: "text", text: "Document tag not found" }],
              isError: true,
            };
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ success: true, deletedId: result.id }),
              },
            ],
            structuredContent: { success: true, deletedId: result.id },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to delete document tag",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "document_tags_assign",
      {
        title: "Assign Tag to Document",
        description:
          "Add a tag to a document. The document will appear when filtering by this tag.",
        inputSchema: {
          documentId: z.string().uuid().describe("Document ID"),
          tagId: z.string().uuid().describe("Document tag ID to assign"),
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async ({ documentId, tagId }) => {
        try {
          await createDocumentTagAssignment(db, {
            documentId,
            tagId,
            teamId,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ success: true, documentId, tagId }),
              },
            ],
            structuredContent: { success: true, documentId, tagId },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to assign tag",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "document_tags_unassign",
      {
        title: "Remove Tag from Document",
        description: "Remove a tag from a document.",
        inputSchema: {
          documentId: z.string().uuid().describe("Document ID"),
          tagId: z.string().uuid().describe("Document tag ID to remove"),
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async ({ documentId, tagId }) => {
        try {
          await deleteDocumentTagAssignment(db, {
            documentId,
            tagId,
            teamId,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ success: true, documentId, tagId }),
              },
            ],
            structuredContent: { success: true, documentId, tagId },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to unassign tag",
              },
            ],
            isError: true,
          };
        }
      },
    );
  }
};
