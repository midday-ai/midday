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
import { PdfTemplate, renderToStream } from "@midday/invoice";
import { z } from "zod";
import {
  DESTRUCTIVE_ANNOTATIONS,
  hasScope,
  READ_ONLY_ANNOTATIONS,
  type RegisterTools,
  WRITE_ANNOTATIONS,
} from "../types";
import { type McpContent, streamToResource } from "../utils";

export const registerInvoiceTools: RegisterTools = (server, ctx) => {
  const { db, teamId, userId, apiUrl } = ctx;

  const hasReadScope = hasScope(ctx, "invoices.read");
  const hasWriteScope = hasScope(ctx, "invoices.write");

  if (!hasReadScope && !hasWriteScope) {
    return;
  }

  if (hasReadScope) {
    const { sort: _sort, ...invoicesListFields } = getInvoicesSchema.shape;

    server.registerTool(
      "invoices_list",
      {
        title: "List Invoices",
        description:
          "List invoices with filtering by status (draft, unpaid, paid, overdue, canceled, scheduled), customer, date range, and free-text search. Returns paginated results (default 25) with invoice number, amount, customer name, status, and PDF download URL.",
        inputSchema: {
          ...invoicesListFields,
          sortBy: z
            .enum([
              "created_at",
              "due_date",
              "issue_date",
              "amount",
              "status",
              "customer",
              "invoice_number",
            ])
            .optional()
            .describe("Column to sort by"),
          sortDirection: z
            .enum(["asc", "desc"])
            .optional()
            .describe("Sort direction"),
        },
        outputSchema: {
          data: z.array(z.record(z.string(), z.any())),
          hasMore: z.boolean(),
          cursor: z.string().nullable().optional(),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async (params) => {
        const sort =
          params.sortBy && params.sortDirection
            ? [params.sortBy, params.sortDirection]
            : null;

        const result = await getInvoices(db, {
          teamId,
          cursor: params.cursor ?? null,
          pageSize: params.pageSize ?? 25,
          q: params.q ?? null,
          start: params.start ?? null,
          end: params.end ?? null,
          statuses: params.statuses ?? null,
          customers: params.customers ?? null,
          sort,
        });

        const data = result.data?.map((invoice) => ({
          ...invoice,
          pdfUrl: invoice.token
            ? `${apiUrl}/files/download/invoice?token=${encodeURIComponent(invoice.token)}`
            : null,
        }));

        const response = { ...result, data };

        return {
          content: [{ type: "text", text: JSON.stringify(response) }],
          structuredContent: response,
        };
      },
    );

    server.registerTool(
      "invoices_get",
      {
        title: "Get Invoice",
        description:
          "Get full invoice details by ID including line items, customer info, amounts, tax, due date, status, and payment history. Set download=true to include the rendered PDF as a binary resource.",
        inputSchema: {
          id: getInvoiceByIdSchema.shape.id,
          download: z
            .boolean()
            .optional()
            .default(false)
            .describe("Include the rendered PDF as a downloadable file"),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async ({ id, download: includePdf }) => {
        const result = await getInvoiceById(db, { id, teamId });

        if (!result) {
          return {
            content: [{ type: "text", text: "Invoice not found" }],
            isError: true,
          };
        }

        const pdfUrl = result.token
          ? `${apiUrl}/files/download/invoice?token=${encodeURIComponent(result.token)}`
          : null;

        const content: McpContent[] = [
          {
            type: "text",
            text: JSON.stringify({ ...result, pdfUrl }),
          },
        ];

        if (includePdf) {
          try {
            const stream = await renderToStream(
              await PdfTemplate(result, { isReceipt: false }),
            );
            const resource = await streamToResource(
              stream,
              pdfUrl ?? `invoice:${id}`,
              "application/pdf",
            );
            content.push(resource);
          } catch {
            content.push({
              type: "text",
              text: "Failed to generate PDF",
            });
          }
        }

        return { content };
      },
    );

    server.registerTool(
      "invoices_summary",
      {
        title: "Invoice Summary",
        description:
          "Get aggregate invoice statistics: total count and amounts grouped by status (draft, unpaid, paid, overdue, canceled, scheduled). Optionally filter to specific statuses.",
        inputSchema: invoiceSummarySchema.shape,
        outputSchema: {
          data: z.record(z.string(), z.any()),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async (params) => {
        const result = await getInvoiceSummary(db, {
          teamId,
          statuses: params.statuses,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
          structuredContent: { data: result },
        };
      },
    );
  }

  if (hasWriteScope) {
    server.registerTool(
      "invoices_update",
      {
        title: "Update Invoice",
        description:
          "Update an invoice's status (paid, canceled, unpaid), payment date, or internal note. Use invoices_mark_paid for a simpler paid-marking flow.",
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
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      },
    );

    server.registerTool(
      "invoices_mark_paid",
      {
        title: "Mark Invoice as Paid",
        description:
          "Mark an invoice as paid. Automatically records the current time as payment date if not specified. Fails if the invoice is already paid.",
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
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      },
    );

    server.registerTool(
      "invoices_delete",
      {
        title: "Delete Invoice",
        description:
          "Permanently delete an invoice. Only invoices with status draft or canceled can be deleted. Active or paid invoices must be canceled first.",
        inputSchema: {
          id: deleteInvoiceSchema.shape.id,
        },
        annotations: DESTRUCTIVE_ANNOTATIONS,
      },
      async ({ id }) => {
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
          "Create a copy of an existing invoice with a new invoice number and today's date. The duplicate starts in draft status.",
        inputSchema: {
          id: duplicateInvoiceSchema.shape.id,
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

        try {
          const invoiceNumber = await getNextInvoiceNumber(db, teamId);

          const result = await duplicateInvoice(db, {
            id,
            teamId,
            userId,
            invoiceNumber,
          });

          return {
            content: [{ type: "text", text: JSON.stringify(result) }],
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
          "Cancel an invoice. Cannot cancel an invoice that is already paid. After cancellation the invoice can be deleted if needed.",
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
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      },
    );
  }
};
