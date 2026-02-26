import {
  deleteDealSchema,
  duplicateDealSchema,
  getDealByIdSchema,
  getDealsSchema,
  dealSummarySchema,
  updateDealSchema,
} from "@api/schemas/deal";
import {
  deleteDeal,
  duplicateDeal,
  getDealById,
  getDealSummary,
  getDeals,
  getNextDealNumber,
  updateDeal,
} from "@midday/db/queries";
import { z } from "zod";
import { READ_ONLY_ANNOTATIONS, type RegisterTools, hasScope } from "../types";

// Annotations for write operations
const WRITE_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
} as const;

// Annotations for destructive operations
const DESTRUCTIVE_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export const registerDealTools: RegisterTools = (server, ctx) => {
  const { db, teamId, userId } = ctx;

  // Check scopes
  const hasReadScope = hasScope(ctx, "deals.read");
  const hasWriteScope = hasScope(ctx, "deals.write");

  // Skip if user has no deal scopes
  if (!hasReadScope && !hasWriteScope) {
    return;
  }

  // ==========================================
  // READ TOOLS
  // ==========================================

  if (hasReadScope) {
    server.registerTool(
      "deals_list",
      {
        title: "List Deals",
        description:
          "List deals with filtering by status, merchant, date range, and search. Use this to find deals.",
        inputSchema: getDealsSchema.shape,
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async (params) => {
        const result = await getDeals(db, {
          teamId,
          cursor: params.cursor ?? null,
          pageSize: params.pageSize ?? 25,
          q: params.q ?? null,
          start: params.start ?? null,
          end: params.end ?? null,
          statuses: params.statuses ?? null,
          merchants: params.merchants ?? null,
          sort: params.sort ?? null,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    server.registerTool(
      "deals_get",
      {
        title: "Get Deal",
        description: "Get a specific deal by its ID with full details",
        inputSchema: {
          id: getDealByIdSchema.shape.id,
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async ({ id }) => {
        const result = await getDealById(db, { id, teamId });

        if (!result) {
          return {
            content: [{ type: "text", text: "Deal not found" }],
            isError: true,
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    server.registerTool(
      "deals_summary",
      {
        title: "Deal Summary",
        description:
          "Get a summary of deals including total amounts and counts by status",
        inputSchema: dealSummarySchema.shape,
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async (params) => {
        const result = await getDealSummary(db, {
          teamId,
          statuses: params.statuses,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );
  }

  // ==========================================
  // WRITE TOOLS
  // ==========================================

  if (hasWriteScope) {
    server.registerTool(
      "deals_update",
      {
        title: "Update Deal",
        description:
          "Update an deal status (paid, canceled, unpaid) or add an internal note. Can also record payment date.",
        inputSchema: {
          id: updateDealSchema.shape.id,
          status: z
            .enum(["paid", "canceled", "unpaid"])
            .optional()
            .describe("New status for the deal"),
          paidAt: z
            .string()
            .datetime()
            .nullable()
            .optional()
            .describe(
              "Payment date in ISO 8601 format (required when marking as paid)",
            ),
          internalNote: z
            .string()
            .nullable()
            .optional()
            .describe("Internal note visible only to your team"),
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        // Check if deal exists
        const existing = await getDealById(db, { id: params.id, teamId });

        if (!existing) {
          return {
            content: [{ type: "text", text: "Deal not found" }],
            isError: true,
          };
        }

        const result = await updateDeal(db, {
          id: params.id,
          teamId,
          status: params.status,
          paidAt: params.paidAt,
          internalNote: params.internalNote,
        });

        if (!result) {
          return {
            content: [{ type: "text", text: "Failed to update deal" }],
            isError: true,
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    server.registerTool(
      "deals_mark_paid",
      {
        title: "Mark Deal as Paid",
        description:
          "Mark an deal as paid. Automatically records the current time as payment date if not specified.",
        inputSchema: {
          id: z.string().uuid().describe("The ID of the deal to mark paid"),
          paidAt: z
            .string()
            .datetime()
            .optional()
            .describe(
              "Payment date in ISO 8601 format (defaults to current time)",
            ),
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        const existing = await getDealById(db, { id: params.id, teamId });

        if (!existing) {
          return {
            content: [{ type: "text", text: "Deal not found" }],
            isError: true,
          };
        }

        if (existing.status === "paid") {
          return {
            content: [{ type: "text", text: "Deal is already marked paid" }],
            isError: true,
          };
        }

        const result = await updateDeal(db, {
          id: params.id,
          teamId,
          status: "paid",
          paidAt: params.paidAt ?? new Date().toISOString(),
        });

        if (!result) {
          return {
            content: [{ type: "text", text: "Failed to mark deal as paid" }],
            isError: true,
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    server.registerTool(
      "deals_delete",
      {
        title: "Delete Deal",
        description:
          "Delete an deal. Only draft or canceled deals can be deleted.",
        inputSchema: {
          id: deleteDealSchema.shape.id,
        },
        annotations: DESTRUCTIVE_ANNOTATIONS,
      },
      async ({ id }) => {
        // Check deal exists and status
        const existing = await getDealById(db, { id, teamId });

        if (!existing) {
          return {
            content: [{ type: "text", text: "Deal not found" }],
            isError: true,
          };
        }

        if (existing.status !== "draft" && existing.status !== "canceled") {
          return {
            content: [
              {
                type: "text",
                text: `Cannot delete deal with status "${existing.status}". Only draft or canceled deals can be deleted.`,
              },
            ],
            isError: true,
          };
        }

        const result = await deleteDeal(db, { id, teamId });

        if (!result) {
          return {
            content: [{ type: "text", text: "Failed to delete deal" }],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: true, deletedId: result.id },
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    server.registerTool(
      "deals_duplicate",
      {
        title: "Duplicate Deal",
        description:
          "Create a copy of an existing deal with a new deal number and current date.",
        inputSchema: {
          id: duplicateDealSchema.shape.id,
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async ({ id }) => {
        // Check deal exists
        const existing = await getDealById(db, { id, teamId });

        if (!existing) {
          return {
            content: [{ type: "text", text: "Deal not found" }],
            isError: true,
          };
        }

        try {
          // Get next deal number
          const dealNumber = await getNextDealNumber(db, teamId);

          const result = await duplicateDeal(db, {
            id,
            teamId,
            userId,
            dealNumber,
          });

          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to duplicate deal",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "deals_cancel",
      {
        title: "Cancel Deal",
        description:
          "Cancel an deal. This marks the deal as canceled and it can then be deleted if needed.",
        inputSchema: {
          id: z.string().uuid().describe("The ID of the deal to cancel"),
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async ({ id }) => {
        const existing = await getDealById(db, { id, teamId });

        if (!existing) {
          return {
            content: [{ type: "text", text: "Deal not found" }],
            isError: true,
          };
        }

        if (existing.status === "canceled") {
          return {
            content: [{ type: "text", text: "Deal is already canceled" }],
            isError: true,
          };
        }

        if (existing.status === "paid") {
          return {
            content: [{ type: "text", text: "Cannot cancel a paid deal" }],
            isError: true,
          };
        }

        const result = await updateDeal(db, {
          id,
          teamId,
          status: "canceled",
        });

        if (!result) {
          return {
            content: [{ type: "text", text: "Failed to cancel deal" }],
            isError: true,
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );
  }
};
