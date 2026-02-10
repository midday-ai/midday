import { getDocumentsSchema } from "@api/schemas/documents";
import { getDocumentById, getDocuments } from "@midday/db/queries";
import { z } from "zod";
import { hasScope, READ_ONLY_ANNOTATIONS, type RegisterTools } from "../types";

export const registerDocumentTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  // Require documents.read scope
  if (!hasScope(ctx, "documents.read")) {
    return;
  }
  server.registerTool(
    "documents_list",
    {
      title: "List Documents",
      description:
        "List documents and files stored in the vault with filtering",
      inputSchema: getDocumentsSchema.shape,
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

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "documents_get",
    {
      title: "Get Document",
      description: "Get a specific document by its ID",
      inputSchema: {
        id: z.string().uuid().describe("Document ID"),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ id }) => {
      const result = await getDocumentById(db, { id, teamId });

      if (!result) {
        return {
          content: [{ type: "text", text: "Document not found" }],
          isError: true,
        };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );
};
