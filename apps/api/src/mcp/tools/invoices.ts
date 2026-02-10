import {
  deleteInvoiceSchema,
  duplicateInvoiceSchema,
  getInvoiceByIdSchema,
  getInvoicesSchema,
  invoiceSummarySchema,
  updateInvoiceSchema,
} from "@api/schemas/invoice";
import {
  deleteInvoice,
  duplicateInvoice,
  getInvoiceById,
  getInvoiceSummary,
  getInvoices,
  getNextInvoiceNumber,
  updateInvoice,
} from "@midday/db/queries";
import { z } from "zod";
import { hasScope, READ_ONLY_ANNOTATIONS, type RegisterTools } from "../types";

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

export const registerInvoiceTools: RegisterTools = (server, ctx) => {
  const { db, teamId, userId } = ctx;

  // Check scopes
  const hasReadScope = hasScope(ctx, "invoices.read");
  const hasWriteScope = hasScope(ctx, "invoices.write");

  // Skip if user has no invoice scopes
  if (!hasReadScope && !hasWriteScope) {
    return;
  }

  // ==========================================
  // READ TOOLS
  // ==========================================

  if (hasReadScope) {
    server.registerTool(
      "invoices_list",
      {
        title: "List Invoices",
        description:
          "List invoices with filtering by status, customer, date range, and search. Use this to find invoices.",
        inputSchema: getInvoicesSchema.shape,
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async (params) => {
        const result = await getInvoices(db, {
          teamId,
          cursor: params.cursor ?? null,
          pageSize: params.pageSize ?? 25,
          q: params.q ?? null,
          start: params.start ?? null,
          end: params.end ?? null,
          statuses: params.statuses ?? null,
          customers: params.customers ?? null,
          sort: params.sort ?? null,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    server.registerTool(
      "invoices_get",
      {
        title: "Get Invoice",
        description: "Get a specific invoice by its ID with full details",
        inputSchema: {
          id: getInvoiceByIdSchema.shape.id,
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async ({ id }) => {
        const result = await getInvoiceById(db, { id, teamId });

        if (!result) {
          return {
            content: [{ type: "text", text: "Invoice not found" }],
            isError: true,
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    server.registerTool(
      "invoices_summary",
      {
        title: "Invoice Summary",
        description:
          "Get a summary of invoices including total amounts and counts by status",
        inputSchema: invoiceSummarySchema.shape,
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async (params) => {
        const result = await getInvoiceSummary(db, {
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
      "invoices_update",
      {
        title: "Update Invoice",
        description:
          "Update an invoice status (paid, canceled, unpaid) or add an internal note. Can also record payment date.",
        inputSchema: {
          id: updateInvoiceSchema.shape.id,
          status: z
            .enum(["paid", "canceled", "unpaid"])
            .optional()
            .describe("New status for the invoice"),
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
        // Check if invoice exists
        const existing = await getInvoiceById(db, { id: params.id, teamId });

        if (!existing) {
          return {
            content: [{ type: "text", text: "Invoice not found" }],
            isError: true,
          };
        }

        const result = await updateInvoice(db, {
          id: params.id,
          teamId,
          status: params.status,
          paidAt: params.paidAt,
          internalNote: params.internalNote,
        });

        if (!result) {
          return {
            content: [{ type: "text", text: "Failed to update invoice" }],
            isError: true,
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    server.registerTool(
      "invoices_mark_paid",
      {
        title: "Mark Invoice as Paid",
        description:
          "Mark an invoice as paid. Automatically records the current time as payment date if not specified.",
        inputSchema: {
          id: z.string().uuid().describe("The ID of the invoice to mark paid"),
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
        const existing = await getInvoiceById(db, { id: params.id, teamId });

        if (!existing) {
          return {
            content: [{ type: "text", text: "Invoice not found" }],
            isError: true,
          };
        }

        if (existing.status === "paid") {
          return {
            content: [{ type: "text", text: "Invoice is already marked paid" }],
            isError: true,
          };
        }

        const result = await updateInvoice(db, {
          id: params.id,
          teamId,
          status: "paid",
          paidAt: params.paidAt ?? new Date().toISOString(),
        });

        if (!result) {
          return {
            content: [{ type: "text", text: "Failed to mark invoice as paid" }],
            isError: true,
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    server.registerTool(
      "invoices_delete",
      {
        title: "Delete Invoice",
        description:
          "Delete an invoice. Only draft or canceled invoices can be deleted.",
        inputSchema: {
          id: deleteInvoiceSchema.shape.id,
        },
        annotations: DESTRUCTIVE_ANNOTATIONS,
      },
      async ({ id }) => {
        // Check invoice exists and status
        const existing = await getInvoiceById(db, { id, teamId });

        if (!existing) {
          return {
            content: [{ type: "text", text: "Invoice not found" }],
            isError: true,
          };
        }

        if (existing.status !== "draft" && existing.status !== "canceled") {
          return {
            content: [
              {
                type: "text",
                text: `Cannot delete invoice with status "${existing.status}". Only draft or canceled invoices can be deleted.`,
              },
            ],
            isError: true,
          };
        }

        const result = await deleteInvoice(db, { id, teamId });

        if (!result) {
          return {
            content: [{ type: "text", text: "Failed to delete invoice" }],
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
      "invoices_duplicate",
      {
        title: "Duplicate Invoice",
        description:
          "Create a copy of an existing invoice with a new invoice number and current date.",
        inputSchema: {
          id: duplicateInvoiceSchema.shape.id,
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async ({ id }) => {
        // Check invoice exists
        const existing = await getInvoiceById(db, { id, teamId });

        if (!existing) {
          return {
            content: [{ type: "text", text: "Invoice not found" }],
            isError: true,
          };
        }

        try {
          // Get next invoice number
          const invoiceNumber = await getNextInvoiceNumber(db, teamId);

          const result = await duplicateInvoice(db, {
            id,
            teamId,
            userId,
            invoiceNumber,
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
                    : "Failed to duplicate invoice",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "invoices_cancel",
      {
        title: "Cancel Invoice",
        description:
          "Cancel an invoice. This marks the invoice as canceled and it can then be deleted if needed.",
        inputSchema: {
          id: z.string().uuid().describe("The ID of the invoice to cancel"),
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async ({ id }) => {
        const existing = await getInvoiceById(db, { id, teamId });

        if (!existing) {
          return {
            content: [{ type: "text", text: "Invoice not found" }],
            isError: true,
          };
        }

        if (existing.status === "canceled") {
          return {
            content: [{ type: "text", text: "Invoice is already canceled" }],
            isError: true,
          };
        }

        if (existing.status === "paid") {
          return {
            content: [{ type: "text", text: "Cannot cancel a paid invoice" }],
            isError: true,
          };
        }

        const result = await updateInvoice(db, {
          id,
          teamId,
          status: "canceled",
        });

        if (!result) {
          return {
            content: [{ type: "text", text: "Failed to cancel invoice" }],
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
