import { getInboxByIdSchema, getInboxSchema } from "@api/schemas/inbox";
import { getInbox, getInboxById } from "@midday/db/queries";
import { z } from "zod";
import {
  mcpInboxDetailSchema,
  mcpInboxItemSchema,
  sanitize,
  sanitizeArray,
} from "../schemas";
import { hasScope, READ_ONLY_ANNOTATIONS, type RegisterTools } from "../types";
import {
  downloadVaultFile,
  getMimeType,
  getVaultSignedUrl,
  type McpContent,
} from "../utils";

export const registerInboxTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  if (!hasScope(ctx, "inbox.read")) {
    return;
  }

  server.registerTool(
    "inbox_list",
    {
      title: "List Inbox Items",
      description:
        "List inbox items (uploaded receipts, invoices, and documents pending processing). Filter by status (pending, done, suggested_match, no_match, other). Returns paginated results (default 25) with file name, status, and matched transaction.",
      inputSchema: getInboxSchema.shape,
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
      const result = await getInbox(db, {
        teamId,
        cursor: params.cursor ?? null,
        pageSize: params.pageSize ?? 25,
        order: params.order ?? null,
        sort: params.sort ?? null,
        q: params.q ?? null,
        status: params.status ?? null,
      });

      const response = {
        meta: {
          cursor: result.meta.cursor ?? null,
          hasNextPage: result.meta.hasNextPage,
          hasPreviousPage: result.meta.hasPreviousPage,
        },
        data: sanitizeArray(mcpInboxItemSchema, result.data ?? []),
      };

      return {
        content: [{ type: "text", text: JSON.stringify(response) }],
        structuredContent: response,
      };
    },
  );

  server.registerTool(
    "inbox_get",
    {
      title: "Get Inbox Item",
      description:
        "Get a single inbox item by ID with full details including matched transaction, extracted data, and a signed download URL. Set download=true to include the file content as a binary resource.",
      inputSchema: {
        id: getInboxByIdSchema.shape.id,
        download: z
          .boolean()
          .optional()
          .default(false)
          .describe("Include the file content as a downloadable resource"),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ id, download: includeFile }) => {
      const result = await getInboxById(db, { id, teamId });

      if (!result) {
        return {
          content: [{ type: "text", text: "Inbox item not found" }],
          isError: true,
        };
      }

      const hasFile = result.filePath && result.filePath.length > 0;
      const storagePath = hasFile ? result.filePath!.join("/") : null;
      const filename = hasFile
        ? result.fileName ||
          result.filePath![result.filePath!.length - 1] ||
          "file"
        : null;

      const fileUrl = storagePath ? await getVaultSignedUrl(storagePath) : null;

      const clean = sanitize(mcpInboxDetailSchema, { ...result, fileUrl });

      const content: McpContent[] = [
        {
          type: "text",
          text: JSON.stringify(clean),
        },
      ];

      if (includeFile && storagePath && fileUrl && filename) {
        try {
          const resource = await downloadVaultFile(
            storagePath,
            fileUrl,
            getMimeType(filename),
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
