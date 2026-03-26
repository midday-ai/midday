import {
  confirmMatchSchema,
  declineMatchSchema,
  deleteInboxSchema,
  getInboxByIdSchema,
  getInboxSchema,
  matchTransactionSchema,
  unmatchTransactionSchema,
  updateInboxSchema,
} from "@api/schemas/inbox";
import {
  confirmSuggestedMatch,
  declineSuggestedMatch,
  deleteInbox,
  getInbox,
  getInboxById,
  matchTransaction,
  unmatchTransaction,
  updateInbox,
} from "@midday/db/queries";
import { z } from "zod";
import {
  mcpInboxDetailSchema,
  mcpInboxItemSchema,
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

export const registerInboxTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  const hasReadScope = hasScope(ctx, "inbox.read");
  const hasWriteScope = hasScope(ctx, "inbox.write");

  if (!hasReadScope && !hasWriteScope) {
    return;
  }

  if (hasReadScope) {
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
      withErrorHandling(async (params) => {
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

        const { text, structuredContent } = truncateListResponse(response);

        return {
          content: [{ type: "text", text }],
          structuredContent,
        };
      }, "Failed to list inbox items"),
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
      withErrorHandling(async ({ id, download: includeFile }) => {
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

        const fileUrl = storagePath
          ? await getVaultSignedUrl(storagePath)
          : null;

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
      }, "Failed to get inbox item"),
    );
  }

  if (hasWriteScope) {
    server.registerTool(
      "inbox_update",
      {
        title: "Update Inbox Item",
        description:
          "Update an inbox item's status, display name, currency, or amount. Use this to mark items as done or update extracted data.",
        inputSchema: {
          id: z.string().uuid().describe("Inbox item ID"),
          status: z
            .enum(["pending", "done", "deleted", "archived"])
            .optional()
            .describe("New status"),
          displayName: updateInboxSchema.shape.displayName,
          currency: updateInboxSchema.shape.currency,
          amount: updateInboxSchema.shape.amount,
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        try {
          const result = await updateInbox(db, {
            id: params.id,
            teamId,
            ...(params.status !== undefined && { status: params.status }),
            ...(params.displayName !== undefined && {
              displayName: params.displayName,
            }),
            ...(params.currency !== undefined && { currency: params.currency }),
            ...(params.amount !== undefined && { amount: params.amount }),
          } as Parameters<typeof updateInbox>[1]);

          if (!result) {
            return {
              content: [{ type: "text", text: "Inbox item not found" }],
              isError: true,
            };
          }

          const clean = sanitize(mcpInboxDetailSchema, result);

          return {
            content: [{ type: "text", text: JSON.stringify(clean) }],
            structuredContent: { data: clean },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to update inbox item",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "inbox_delete",
      {
        title: "Delete Inbox Item",
        description:
          "Permanently delete an inbox item and its associated file. This action cannot be undone.",
        inputSchema: {
          id: deleteInboxSchema.shape.id,
        },
        annotations: DESTRUCTIVE_ANNOTATIONS,
      },
      async ({ id }) => {
        try {
          const result = await deleteInbox(db, { id, teamId });

          if (!result) {
            return {
              content: [{ type: "text", text: "Inbox item not found" }],
              isError: true,
            };
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ success: true, deletedId: id }),
              },
            ],
            structuredContent: { success: true, deletedId: id },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to delete inbox item",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "inbox_match_transaction",
      {
        title: "Match Inbox to Transaction",
        description:
          "Link an inbox item (receipt/document) to a bank transaction. The document becomes the transaction's attachment.",
        inputSchema: {
          id: matchTransactionSchema.shape.id,
          transactionId: matchTransactionSchema.shape.transactionId,
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async ({ id, transactionId }) => {
        try {
          const result = await matchTransaction(db, {
            id,
            transactionId,
            teamId,
          });

          if (!result) {
            return {
              content: [
                {
                  type: "text",
                  text: "Failed to match — inbox item or transaction not found",
                },
              ],
              isError: true,
            };
          }

          const clean = sanitize(mcpInboxDetailSchema, result);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  message: "Inbox item matched to transaction",
                  item: clean,
                }),
              },
            ],
            structuredContent: {
              message: "Inbox item matched to transaction",
              item: clean,
            },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to match inbox item",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "inbox_unmatch_transaction",
      {
        title: "Unmatch Inbox from Transaction",
        description:
          "Remove the link between an inbox item and a transaction. The inbox item returns to unmatched status.",
        inputSchema: {
          id: unmatchTransactionSchema.shape.id,
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async ({ id }) => {
        try {
          await unmatchTransaction(db, { id, teamId });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ success: true, unmatched: id }),
              },
            ],
            structuredContent: { success: true, unmatched: id },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to unmatch inbox item",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "inbox_confirm_match",
      {
        title: "Confirm Suggested Match",
        description:
          "Confirm an AI-suggested match between an inbox item and a transaction. This links them together as if manually matched.",
        inputSchema: confirmMatchSchema.shape,
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        try {
          const result = await confirmSuggestedMatch(db, {
            teamId,
            suggestionId: params.suggestionId,
            inboxId: params.inboxId,
            transactionId: params.transactionId,
            userId: ctx.userId,
          });

          if (!result) {
            return {
              content: [{ type: "text", text: "Failed to confirm match" }],
              isError: true,
            };
          }

          const clean = sanitize(mcpInboxDetailSchema, result);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  message: "Match confirmed",
                  item: clean,
                }),
              },
            ],
            structuredContent: { message: "Match confirmed", item: clean },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to confirm match",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "inbox_decline_match",
      {
        title: "Decline Suggested Match",
        description:
          "Decline an AI-suggested match between an inbox item and a transaction. The suggestion is dismissed.",
        inputSchema: {
          suggestionId: declineMatchSchema.shape.suggestionId,
          inboxId: declineMatchSchema.shape.inboxId,
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        try {
          await declineSuggestedMatch(db, {
            suggestionId: params.suggestionId,
            inboxId: params.inboxId,
            userId: ctx.userId,
            teamId,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  message: "Match suggestion declined",
                }),
              },
            ],
            structuredContent: {
              success: true,
              message: "Match suggestion declined",
            },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to decline match",
              },
            ],
            isError: true,
          };
        }
      },
    );
  }
};
