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
  draftInvoice,
  duplicateInvoice,
  getAverageDaysToPayment,
  getAverageInvoiceSize,
  getCustomerById,
  getInactiveClientsCount,
  getInvoiceById,
  getInvoiceSummary,
  getInvoices,
  getInvoiceTemplate,
  getMostActiveClient,
  getNewCustomersCount,
  getNextInvoiceNumber,
  getPaymentStatus,
  getTopRevenueClient,
  getTrackerProjectById,
  getTrackerRecordsByRange,
  isInvoiceNumberUsed,
  searchInvoiceNumber,
  updateInvoice,
} from "@midday/db/queries";
import { DEFAULT_TEMPLATE, PdfTemplate, renderToStream } from "@midday/invoice";
import { calculateTotal } from "@midday/invoice/calculate";
import { transformCustomerToContent } from "@midday/invoice/utils";
import { triggerJob } from "@midday/job-client";
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { addDays } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import {
  mcpInvoiceDetailSchema,
  mcpInvoiceListItemSchema,
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
  DASHBOARD_URL,
  type McpContent,
  streamToResource,
  textToEditorDoc,
  truncateListResponse,
  withErrorHandling,
} from "../utils";

function isAllowedLogoUrl(url: string): boolean {
  return url.startsWith("https://service.midday.ai/");
}

async function embedLogoAsDataUrl(
  invoice: Record<string, any>,
): Promise<Record<string, any>> {
  const logoUrl = invoice.template?.logoUrl;
  if (!logoUrl || typeof logoUrl !== "string") return invoice;
  if (logoUrl.startsWith("data:")) return invoice;
  if (!isAllowedLogoUrl(logoUrl)) return invoice;

  try {
    const res = await fetch(logoUrl, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return invoice;

    const contentType = res.headers.get("content-type") || "image/png";
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    return {
      ...invoice,
      template: {
        ...invoice.template,
        logoUrl: `data:${contentType};base64,${base64}`,
      },
    };
  } catch {
    return invoice;
  }
}

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
        const sort = params.sortBy
          ? [params.sortBy, params.sortDirection ?? "desc"]
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

        const data = sanitizeArray(
          mcpInvoiceListItemSchema,
          (result.data ?? []).map((invoice) => ({
            ...invoice,
            pdfUrl: invoice.token
              ? `${apiUrl}/files/download/invoice?token=${encodeURIComponent(invoice.token)}`
              : null,
            previewUrl: invoice.token
              ? `${DASHBOARD_URL}/i/${invoice.token}`
              : null,
          })),
        );

        const response = {
          meta: {
            cursor: result.meta.cursor ?? null,
            hasNextPage: result.meta.hasNextPage,
            hasPreviousPage: result.meta.hasPreviousPage,
          },
          data,
        };

        const { text, structuredContent } = truncateListResponse(response);

        return {
          content: [{ type: "text" as const, text }],
          structuredContent,
        };
      }, "Failed to list invoices"),
    );

    registerAppTool(
      server,
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
        _meta: { ui: { resourceUri: "ui://midday/invoice-preview" } },
      },
      withErrorHandling(async ({ id, download: includePdf }) => {
        const result = await getInvoiceById(db, { id, teamId });

        if (!result) {
          return {
            content: [{ type: "text" as const, text: "Invoice not found" }],
            isError: true,
          };
        }

        const pdfUrl = result.token
          ? `${apiUrl}/files/download/invoice?token=${encodeURIComponent(result.token)}`
          : null;
        const previewUrl = result.token
          ? `${DASHBOARD_URL}/i/${result.token}`
          : null;

        const clean = sanitize(mcpInvoiceDetailSchema, {
          ...result,
          pdfUrl,
          previewUrl,
        });

        const content: McpContent[] = [
          {
            type: "text" as const,
            text: JSON.stringify(clean),
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
              type: "text" as const,
              text: "Failed to generate PDF",
            });
          }
        }

        const invoiceForUI = await embedLogoAsDataUrl(clean);
        return { content, structuredContent: { invoice: invoiceForUI } };
      }, "Failed to get invoice"),
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
      withErrorHandling(async (params) => {
        const result = await getInvoiceSummary(db, {
          teamId,
          statuses: params.statuses,
        });

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result) }],
          structuredContent: { data: result },
        };
      }, "Failed to get invoice summary"),
    );

    server.registerTool(
      "invoices_search_number",
      {
        title: "Search Invoice Number",
        description:
          "Search for an invoice by its invoice number. Returns the matching invoice number if found. Useful for checking if a specific invoice number exists.",
        inputSchema: {
          query: z.string().describe("Invoice number to search for"),
        },
        outputSchema: {
          data: z.record(z.string(), z.any()).nullable(),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      withErrorHandling(async ({ query }) => {
        const result = await searchInvoiceNumber(db, { teamId, query });

        if (!result) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No matching invoice number found",
              },
            ],
            structuredContent: { data: null },
          };
        }

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result) }],
          structuredContent: { data: result },
        };
      }, "Failed to search invoice number"),
    );

    server.registerTool(
      "invoices_payment_status",
      {
        title: "Invoice Payment Status Score",
        description:
          "Get the team's overall invoice payment health score and status. Returns a score (0-100) and a descriptive payment status indicating how well clients are paying.",
        inputSchema: {},
        outputSchema: {
          data: z.record(z.string(), z.any()),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      withErrorHandling(async () => {
        const result = await getPaymentStatus(db, teamId);

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result) }],
          structuredContent: { data: result },
        };
      }, "Failed to get payment status"),
    );

    server.registerTool(
      "invoices_analytics",
      {
        title: "Invoice Analytics",
        description:
          "Get comprehensive invoice analytics: average days to payment, average invoice size by currency, most active client, top revenue client, inactive clients count, and new customers count. Provides a holistic view of invoicing health.",
        inputSchema: {},
        outputSchema: {
          data: z.record(z.string(), z.any()),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      withErrorHandling(async () => {
        const [
          avgDaysToPayment,
          avgInvoiceSize,
          mostActiveClient,
          topRevenueClient,
          inactiveClientsCount,
          newCustomersCount,
        ] = await Promise.all([
          getAverageDaysToPayment(db, { teamId }),
          getAverageInvoiceSize(db, { teamId }),
          getMostActiveClient(db, { teamId }),
          getTopRevenueClient(db, { teamId }),
          getInactiveClientsCount(db, { teamId }),
          getNewCustomersCount(db, { teamId }),
        ]);

        const analytics = {
          averageDaysToPayment: avgDaysToPayment,
          averageInvoiceSize: avgInvoiceSize,
          mostActiveClient,
          topRevenueClient,
          inactiveClientsCount,
          newCustomersCount,
        };

        return {
          content: [{ type: "text" as const, text: JSON.stringify(analytics) }],
          structuredContent: { data: analytics },
        };
      }, "Failed to get invoice analytics"),
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
        try {
          const existing = await getInvoiceById(db, {
            id: params.id,
            teamId,
          });

          if (!existing) {
            return {
              content: [{ type: "text", text: "Invoice not found" }],
              isError: true,
            };
          }

          const result = await updateInvoice(db, {
            id: params.id,
            teamId,
            userId,
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

          const previewUrl = existing.token
            ? `${DASHBOARD_URL}/i/${existing.token}`
            : null;

          const clean = sanitize(mcpInvoiceDetailSchema, {
            ...result,
            previewUrl,
          });

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
                    : "Failed to update invoice",
              },
            ],
            isError: true,
          };
        }
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
        try {
          const existing = await getInvoiceById(db, {
            id: params.id,
            teamId,
          });

          if (!existing) {
            return {
              content: [{ type: "text", text: "Invoice not found" }],
              isError: true,
            };
          }

          if (existing.status === "paid") {
            return {
              content: [
                { type: "text", text: "Invoice is already marked paid" },
              ],
              isError: true,
            };
          }

          const result = await updateInvoice(db, {
            id: params.id,
            teamId,
            userId,
            status: "paid",
            paidAt: params.paidAt ?? new Date().toISOString(),
          });

          if (!result) {
            return {
              content: [
                { type: "text", text: "Failed to mark invoice as paid" },
              ],
              isError: true,
            };
          }

          const previewUrl = existing.token
            ? `${DASHBOARD_URL}/i/${existing.token}`
            : null;

          const clean = sanitize(mcpInvoiceDetailSchema, {
            ...result,
            previewUrl,
          });

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
                    : "Failed to mark invoice as paid",
              },
            ],
            isError: true,
          };
        }
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
        try {
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
                    : "Failed to delete invoice",
              },
            ],
            isError: true,
          };
        }
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
        try {
          const existing = await getInvoiceById(db, { id, teamId });

          if (!existing) {
            return {
              content: [{ type: "text", text: "Invoice not found" }],
              isError: true,
            };
          }

          const invoiceNumber = await getNextInvoiceNumber(db, teamId);

          const result = await duplicateInvoice(db, {
            id,
            teamId,
            userId,
            invoiceNumber,
          });

          const previewUrl = result?.token
            ? `${DASHBOARD_URL}/i/${result.token}`
            : null;

          const clean = sanitize(mcpInvoiceDetailSchema, {
            ...result,
            previewUrl,
          });

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
        try {
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
            userId,
            status: "canceled",
          });

          if (!result) {
            return {
              content: [{ type: "text", text: "Failed to cancel invoice" }],
              isError: true,
            };
          }

          const previewUrl = existing.token
            ? `${DASHBOARD_URL}/i/${existing.token}`
            : null;

          const clean = sanitize(mcpInvoiceDetailSchema, {
            ...result,
            previewUrl,
          });

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
                    : "Failed to cancel invoice",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "invoices_remind",
      {
        title: "Send Invoice Reminder",
        description:
          "Send a payment reminder email for an unpaid or overdue invoice. Records the reminder timestamp on the invoice. Cannot remind for draft, paid, or canceled invoices.",
        inputSchema: {
          id: z
            .string()
            .uuid()
            .describe("ID of the invoice to send a reminder for"),
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async ({ id }) => {
        try {
          const existing = await getInvoiceById(db, { id, teamId });

          if (!existing) {
            return {
              content: [{ type: "text", text: "Invoice not found" }],
              isError: true,
            };
          }

          if (existing.status !== "unpaid" && existing.status !== "overdue") {
            return {
              content: [
                {
                  type: "text",
                  text: `Cannot send a reminder for invoice with status "${existing.status}". Only unpaid or overdue invoices can receive reminders.`,
                },
              ],
              isError: true,
            };
          }

          const now = new Date().toISOString();

          await triggerJob(
            "send-invoice-reminder",
            { invoiceId: id },
            "invoices",
          );

          await updateInvoice(db, {
            id,
            teamId,
            userId,
            reminderSentAt: now,
          });

          const previewUrl = existing.token
            ? `${DASHBOARD_URL}/i/${existing.token}`
            : null;

          const response = {
            message: `Payment reminder sent for invoice ${existing.invoiceNumber}${existing.sentTo ? ` to ${existing.sentTo}` : ""}`,
            invoiceId: id,
            reminderSentAt: now,
            previewUrl,
          };

          return {
            content: [{ type: "text", text: JSON.stringify(response) }],
            structuredContent: response,
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to send invoice reminder",
              },
            ],
            isError: true,
          };
        }
      },
    );

    registerAppTool(
      server,
      "invoices_create",
      {
        title: "Create Invoice",
        description:
          "Create a new invoice for a customer. Uses the team's saved invoice template by default (logo, labels, payment details, tax settings), but VAT, tax, and discount settings can be overridden per-invoice. Line items are required. Invoices are created as drafts by default — use invoices_send to send after review. Set deliveryType to 'create' to finalize without sending, or 'create_and_send' to finalize and email immediately.",
        _meta: { ui: { resourceUri: "ui://midday/invoice-preview" } },
        inputSchema: {
          customerId: z
            .string()
            .uuid()
            .describe("ID of the customer to invoice"),
          lineItems: z
            .array(
              z.object({
                name: z.string().describe("Line item description"),
                quantity: z
                  .number()
                  .min(0)
                  .describe("Quantity (e.g. hours, units)"),
                price: z.number().describe("Unit price"),
                unit: z
                  .string()
                  .optional()
                  .describe("Unit label (e.g. 'hours', 'units')"),
                taxRate: z
                  .number()
                  .min(0)
                  .max(100)
                  .optional()
                  .describe(
                    "Per-line tax rate percentage (used when includeLineItemTax is true)",
                  ),
              }),
            )
            .min(1)
            .describe("Invoice line items"),
          deliveryType: z
            .enum(["draft", "create", "create_and_send"])
            .optional()
            .describe(
              "How to process the invoice: 'draft' (default) saves as draft for preview/editing (use invoices_send to send later), 'create' finalizes without sending, 'create_and_send' finalizes and emails to the customer",
            ),
          dueDate: z
            .string()
            .optional()
            .describe(
              "Due date in ISO 8601 format (defaults to issue date + payment terms from template)",
            ),
          issueDate: z
            .string()
            .optional()
            .describe("Issue date in ISO 8601 format (defaults to today)"),
          invoiceNumber: z
            .string()
            .optional()
            .describe("Custom invoice number (auto-generated if omitted)"),
          currency: z
            .string()
            .optional()
            .describe("Currency code override (defaults to template currency)"),
          note: z
            .string()
            .optional()
            .describe("Plain text note to display on the invoice footer"),
          discount: z
            .number()
            .min(0)
            .optional()
            .describe("Discount amount to subtract from total"),
          includeVat: z
            .boolean()
            .optional()
            .describe(
              "Enable VAT on this invoice. Automatically enabled when vatRate > 0. Set to false to remove VAT.",
            ),
          vatRate: z
            .number()
            .min(0)
            .max(100)
            .optional()
            .describe(
              "VAT rate percentage, e.g. 25 for 25% VAT. Setting this automatically enables VAT.",
            ),
          includeTax: z
            .boolean()
            .optional()
            .describe(
              "Enable invoice-level tax. Automatically enabled when taxRate > 0. Set to false to remove tax.",
            ),
          taxRate: z
            .number()
            .min(0)
            .max(100)
            .optional()
            .describe(
              "Tax rate percentage, e.g. 10 for 10% tax. Setting this automatically enables tax.",
            ),
          includeDiscount: z
            .boolean()
            .optional()
            .describe(
              "Show the discount row on the invoice (overrides template setting)",
            ),
          includeLineItemTax: z
            .boolean()
            .optional()
            .describe(
              "Use per-line-item tax rates instead of a single invoice-level tax rate",
            ),
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        try {
          const customer = await getCustomerById(db, {
            id: params.customerId,
            teamId,
          });

          if (!customer) {
            return {
              content: [
                {
                  type: "text",
                  text: `Customer not found (id: ${params.customerId}). Use customers_list to find valid customer IDs.`,
                },
              ],
              isError: true,
            };
          }

          const savedTemplate = await getInvoiceTemplate(db, teamId);
          const paymentTermsDays = savedTemplate?.paymentTermsDays ?? 30;

          const mergedTemplate = {
            ...DEFAULT_TEMPLATE,
            ...Object.fromEntries(
              Object.entries(savedTemplate ?? {}).filter(([_, v]) => v != null),
            ),
            ...(params.currency
              ? { currency: params.currency.toUpperCase() }
              : {}),
            ...(params.includeVat !== undefined
              ? { includeVat: params.includeVat }
              : {}),
            ...(params.vatRate !== undefined
              ? { vatRate: params.vatRate }
              : {}),
            ...(params.includeTax !== undefined
              ? { includeTax: params.includeTax }
              : {}),
            ...(params.taxRate !== undefined
              ? { taxRate: params.taxRate }
              : {}),
            ...(params.includeDiscount !== undefined
              ? { includeDiscount: params.includeDiscount }
              : {}),
            ...(params.includeLineItemTax !== undefined
              ? { includeLineItemTax: params.includeLineItemTax }
              : {}),
            deliveryType:
              !params.deliveryType || params.deliveryType === "draft"
                ? ("create" as const)
                : params.deliveryType,
          };

          if (
            params.vatRate !== undefined &&
            params.vatRate > 0 &&
            params.includeVat === undefined
          ) {
            mergedTemplate.includeVat = true;
          }
          if (
            params.taxRate !== undefined &&
            params.taxRate > 0 &&
            params.includeTax === undefined
          ) {
            mergedTemplate.includeTax = true;
          }

          let invoiceNumber: string;
          if (params.invoiceNumber) {
            const isUsed = await isInvoiceNumberUsed(
              db,
              teamId,
              params.invoiceNumber,
            );
            if (isUsed) {
              return {
                content: [
                  {
                    type: "text",
                    text: `Invoice number '${params.invoiceNumber}' is already used. Omit the invoiceNumber parameter to auto-generate one.`,
                  },
                ],
                isError: true,
              };
            }
            invoiceNumber = params.invoiceNumber;
          } else {
            invoiceNumber = await getNextInvoiceNumber(db, teamId);
          }

          const issueDateStr = params.issueDate ?? new Date().toISOString();
          const dueDateStr =
            params.dueDate ??
            addDays(new Date(issueDateStr), paymentTermsDays).toISOString();

          const customerDetails = transformCustomerToContent(customer);
          const noteDetails =
            params.note !== undefined
              ? JSON.stringify(textToEditorDoc(params.note))
              : savedTemplate?.noteDetails
                ? JSON.stringify(savedTemplate.noteDetails)
                : null;

          const { subTotal, total, vat, tax } = calculateTotal({
            lineItems: params.lineItems,
            taxRate: mergedTemplate.taxRate ?? 0,
            vatRate: mergedTemplate.vatRate ?? 0,
            discount: params.discount ?? 0,
            includeVat: mergedTemplate.includeVat ?? false,
            includeTax: mergedTemplate.includeTax ?? false,
            includeLineItemTax: mergedTemplate.includeLineItemTax ?? false,
          });

          const invoiceId = uuidv4();

          const result = await draftInvoice(db, {
            id: invoiceId,
            teamId,
            userId,
            invoiceNumber,
            issueDate: issueDateStr,
            dueDate: dueDateStr,
            templateId: savedTemplate?.id ?? null,
            template: mergedTemplate,
            customerId: params.customerId,
            customerName: customer.name,
            customerDetails: customerDetails
              ? JSON.stringify(customerDetails)
              : null,
            fromDetails: savedTemplate?.fromDetails
              ? JSON.stringify(savedTemplate.fromDetails)
              : null,
            paymentDetails: savedTemplate?.paymentDetails
              ? JSON.stringify(savedTemplate.paymentDetails)
              : null,
            noteDetails,
            logoUrl: mergedTemplate.logoUrl,
            lineItems: params.lineItems.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              unit: item.unit ?? null,
              taxRate: item.taxRate ?? null,
            })),
            subtotal: subTotal,
            amount: total,
            vat,
            tax,
            discount: params.discount ?? null,
          });

          if (!result) {
            return {
              content: [{ type: "text", text: "Failed to create invoice" }],
              isError: true,
            };
          }

          const delivery = params.deliveryType ?? "draft";

          if (delivery !== "draft") {
            await updateInvoice(db, {
              id: result.id,
              status: "unpaid",
              teamId,
              userId,
              sentTo:
                delivery === "create_and_send"
                  ? (customer.email ?? null)
                  : null,
            });

            await triggerJob(
              "generate-invoice",
              { invoiceId: result.id, deliveryType: delivery },
              "invoices",
            );
          }

          const fresh = await getInvoiceById(db, {
            id: result.id,
            teamId,
          });

          const pdfUrl = fresh?.token
            ? `${apiUrl}/files/download/invoice?token=${encodeURIComponent(fresh.token)}`
            : null;
          const previewUrl = fresh?.token
            ? `${DASHBOARD_URL}/i/${fresh.token}`
            : null;

          const clean = sanitize(mcpInvoiceDetailSchema, {
            ...(fresh ?? result),
            pdfUrl,
            previewUrl,
          });

          const action =
            delivery === "create_and_send"
              ? `created and will be sent to ${customer.email ?? "customer"}`
              : delivery === "draft"
                ? "saved as draft — use invoices_send to send, or open the previewUrl to review"
                : "created";

          const invoiceForUI = await embedLogoAsDataUrl(clean);

          const response = {
            message: `Invoice ${invoiceNumber} ${action}. Total: ${total} ${mergedTemplate.currency}`,
            invoice: clean,
          };

          return {
            content: [{ type: "text", text: JSON.stringify(response) }],
            structuredContent: { ...response, invoice: invoiceForUI },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to create invoice",
              },
            ],
            isError: true,
          };
        }
      },
    );

    registerAppTool(
      server,
      "invoices_update_draft",
      {
        title: "Update Draft Invoice",
        description:
          "Edit a draft invoice's content: line items, customer, dates, payment terms, note, discount, and tax/VAT settings. Only works on invoices in draft status. Amounts are automatically recalculated when line items, discount, or tax settings change. Use paymentTermsDays to set the due date relative to the issue date (e.g. 30 for net-30). Prefer this tool over invoice_template_update when the user wants to change an existing draft invoice.",
        _meta: { ui: { resourceUri: "ui://midday/invoice-preview" } },
        inputSchema: {
          id: z.string().uuid().describe("ID of the draft invoice to update"),
          customerId: z
            .string()
            .uuid()
            .optional()
            .describe(
              "Change the customer (updates customer details on the invoice)",
            ),
          lineItems: z
            .array(
              z.object({
                name: z.string().describe("Line item description"),
                quantity: z.number().min(0).describe("Quantity"),
                price: z.number().describe("Unit price"),
                unit: z.string().optional().describe("Unit label"),
                taxRate: z
                  .number()
                  .min(0)
                  .max(100)
                  .optional()
                  .describe(
                    "Per-line tax rate percentage (used when includeLineItemTax is true)",
                  ),
              }),
            )
            .min(1)
            .optional()
            .describe(
              "Replacement line items (replaces all existing line items)",
            ),
          dueDate: z
            .string()
            .optional()
            .describe(
              "New due date in ISO 8601 format. Ignored when paymentTermsDays is provided.",
            ),
          paymentTermsDays: z
            .number()
            .min(0)
            .max(365)
            .optional()
            .describe(
              "Payment terms in days (e.g. 30 for net-30). Sets the due date to issueDate + this many days. Takes precedence over dueDate.",
            ),
          issueDate: z
            .string()
            .optional()
            .describe("New issue date in ISO 8601 format"),
          note: z
            .string()
            .optional()
            .describe("Plain text note for the invoice footer"),
          discount: z.number().min(0).optional().describe("Discount amount"),
          currency: z.string().optional().describe("Currency code override"),
          includeVat: z
            .boolean()
            .optional()
            .describe(
              "Enable VAT on this invoice. Automatically enabled when vatRate > 0. Set to false to remove VAT.",
            ),
          vatRate: z
            .number()
            .min(0)
            .max(100)
            .optional()
            .describe(
              "VAT rate percentage, e.g. 25 for 25% VAT. Setting this automatically enables VAT.",
            ),
          includeTax: z
            .boolean()
            .optional()
            .describe(
              "Enable invoice-level tax. Automatically enabled when taxRate > 0. Set to false to remove tax.",
            ),
          taxRate: z
            .number()
            .min(0)
            .max(100)
            .optional()
            .describe(
              "Tax rate percentage, e.g. 10 for 10% tax. Setting this automatically enables tax.",
            ),
          includeDiscount: z
            .boolean()
            .optional()
            .describe("Show the discount row on the invoice"),
          includeLineItemTax: z
            .boolean()
            .optional()
            .describe(
              "Use per-line-item tax rates instead of a single invoice-level tax rate",
            ),
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        try {
          const existing = await getInvoiceById(db, {
            id: params.id,
            teamId,
          });

          if (!existing) {
            return {
              content: [{ type: "text", text: "Invoice not found" }],
              isError: true,
            };
          }

          if (existing.status !== "draft") {
            return {
              content: [
                {
                  type: "text",
                  text: `Cannot edit invoice with status "${existing.status}". Only draft invoices can be edited. Use invoices_duplicate to create an editable copy.`,
                },
              ],
              isError: true,
            };
          }

          const existingTemplate =
            (existing.template as Record<string, unknown>) ?? {};

          let customerDetails = existing.customerDetails
            ? JSON.stringify(existing.customerDetails)
            : null;
          let customerName = existing.customerName;
          let customerId = existing.customerId;

          if (params.customerId && params.customerId !== existing.customerId) {
            const customer = await getCustomerById(db, {
              id: params.customerId,
              teamId,
            });

            if (!customer) {
              return {
                content: [
                  {
                    type: "text",
                    text: `Customer not found (id: ${params.customerId}).`,
                  },
                ],
                isError: true,
              };
            }

            const content = transformCustomerToContent(customer);
            customerDetails = content ? JSON.stringify(content) : null;
            customerName = customer.name;
            customerId = customer.id;
          }

          const templateCurrency =
            params.currency?.toUpperCase() ??
            (existingTemplate.currency as string) ??
            "USD";

          const updatedTemplate = {
            ...existingTemplate,
            ...(params.currency ? { currency: templateCurrency } : {}),
            ...(params.includeVat !== undefined
              ? { includeVat: params.includeVat }
              : {}),
            ...(params.vatRate !== undefined
              ? { vatRate: params.vatRate }
              : {}),
            ...(params.includeTax !== undefined
              ? { includeTax: params.includeTax }
              : {}),
            ...(params.taxRate !== undefined
              ? { taxRate: params.taxRate }
              : {}),
            ...(params.includeDiscount !== undefined
              ? { includeDiscount: params.includeDiscount }
              : {}),
            ...(params.includeLineItemTax !== undefined
              ? { includeLineItemTax: params.includeLineItemTax }
              : {}),
          };

          if (
            params.vatRate !== undefined &&
            params.vatRate > 0 &&
            params.includeVat === undefined
          ) {
            updatedTemplate.includeVat = true;
          }
          if (
            params.taxRate !== undefined &&
            params.taxRate > 0 &&
            params.includeTax === undefined
          ) {
            updatedTemplate.includeTax = true;
          }

          const existingLineItems = (existing.lineItems ?? []).map(
            (item: any) => ({
              name: item.name ?? "",
              quantity: item.quantity ?? 0,
              price: item.price ?? 0,
              unit: item.unit ?? null,
              taxRate: item.taxRate ?? null,
            }),
          );

          const lineItems = params.lineItems
            ? params.lineItems.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                unit: item.unit ?? null,
                taxRate: item.taxRate ?? null,
              }))
            : existingLineItems;

          const discount = params.discount ?? existing.discount ?? 0;

          const { subTotal, total, vat, tax } = calculateTotal({
            lineItems,
            taxRate: (updatedTemplate.taxRate as number) ?? 0,
            vatRate: (updatedTemplate.vatRate as number) ?? 0,
            discount,
            includeVat: (updatedTemplate.includeVat as boolean) ?? false,
            includeTax: (updatedTemplate.includeTax as boolean) ?? false,
            includeLineItemTax:
              (updatedTemplate.includeLineItemTax as boolean) ?? false,
          });

          const noteDetails =
            params.note !== undefined
              ? JSON.stringify(textToEditorDoc(params.note))
              : existing.noteDetails
                ? JSON.stringify(existing.noteDetails)
                : null;

          const resolvedIssueDate = params.issueDate ?? existing.issueDate!;
          const resolvedDueDate =
            params.paymentTermsDays !== undefined
              ? addDays(
                  new Date(resolvedIssueDate),
                  params.paymentTermsDays,
                ).toISOString()
              : (params.dueDate ?? existing.dueDate!);

          const result = await draftInvoice(db, {
            id: params.id,
            teamId,
            userId,
            invoiceNumber: existing.invoiceNumber!,
            issueDate: resolvedIssueDate,
            dueDate: resolvedDueDate,
            templateId: existing.templateId ?? null,
            template: updatedTemplate as any,
            customerId,
            customerName,
            customerDetails,
            fromDetails: existing.fromDetails
              ? JSON.stringify(existing.fromDetails)
              : null,
            paymentDetails: existing.paymentDetails
              ? JSON.stringify(existing.paymentDetails)
              : null,
            noteDetails,
            logoUrl: (existingTemplate.logoUrl as string) ?? null,
            lineItems,
            subtotal: subTotal,
            amount: total,
            vat,
            tax,
            discount,
          });

          if (!result) {
            return {
              content: [
                { type: "text", text: "Failed to update draft invoice" },
              ],
              isError: true,
            };
          }

          const fresh = await getInvoiceById(db, {
            id: params.id,
            teamId,
          });

          const pdfUrl = fresh?.token
            ? `${apiUrl}/files/download/invoice?token=${encodeURIComponent(fresh.token)}`
            : null;
          const previewUrl = fresh?.token
            ? `${DASHBOARD_URL}/i/${fresh.token}`
            : null;

          const clean = sanitize(mcpInvoiceDetailSchema, {
            ...(fresh ?? result),
            pdfUrl,
            previewUrl,
          });

          const invoiceForUI = await embedLogoAsDataUrl(clean);

          const response = {
            message: `Draft invoice ${existing.invoiceNumber} updated. Total: ${total} ${templateCurrency}`,
            invoice: clean,
          };

          return {
            content: [{ type: "text", text: JSON.stringify(response) }],
            structuredContent: { ...response, invoice: invoiceForUI },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to update draft invoice",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "invoices_send",
      {
        title: "Send Invoice",
        description:
          "Send a draft invoice to the customer via email. Generates the PDF and emails it. Only works on invoices in draft status — use invoices_create with deliveryType 'draft' first, then invoices_send to send after review.",
        inputSchema: {
          id: z.string().uuid().describe("ID of the draft invoice to send"),
          sentTo: z
            .string()
            .email()
            .optional()
            .describe(
              "Override recipient email address (defaults to customer's email on file)",
            ),
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async ({ id, sentTo }) => {
        try {
          const existing = await getInvoiceById(db, { id, teamId });

          if (!existing) {
            return {
              content: [{ type: "text", text: "Invoice not found" }],
              isError: true,
            };
          }

          if (existing.status !== "draft") {
            return {
              content: [
                {
                  type: "text",
                  text: `Cannot send invoice with status "${existing.status}". Only draft invoices can be sent. Use invoices_create with deliveryType 'create_and_send' for new invoices.`,
                },
              ],
              isError: true,
            };
          }

          const recipientEmail =
            sentTo ?? existing.sentTo ?? existing.customer?.email ?? null;

          if (!recipientEmail) {
            return {
              content: [
                {
                  type: "text",
                  text: "No recipient email address found. The customer has no email on file. Provide a sentTo email address, or update the customer's email first.",
                },
              ],
              isError: true,
            };
          }

          await updateInvoice(db, {
            id,
            teamId,
            userId,
            status: "unpaid",
            sentTo: recipientEmail,
          });

          await triggerJob(
            "generate-invoice",
            { invoiceId: id, deliveryType: "create_and_send" },
            "invoices",
          );

          const previewUrl = existing.token
            ? `${DASHBOARD_URL}/i/${existing.token}`
            : null;

          const response = {
            message: `Invoice ${existing.invoiceNumber} is being sent to ${recipientEmail}`,
            invoiceId: id,
            sentTo: recipientEmail,
            previewUrl,
          };

          return {
            content: [{ type: "text", text: JSON.stringify(response) }],
            structuredContent: response,
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to send invoice",
              },
            ],
            isError: true,
          };
        }
      },
    );

    registerAppTool(
      server,
      "invoices_create_from_tracker",
      {
        title: "Create Invoice from Time Tracker",
        description:
          "Create an invoice from tracked time entries on a project. Specify the project and date range to include. Line items are auto-generated from time entries using the project's billable rate. The invoice is created as a draft. VAT, tax, and discount settings can be overridden per-invoice.",
        _meta: { ui: { resourceUri: "ui://midday/invoice-preview" } },
        inputSchema: {
          projectId: z
            .string()
            .uuid()
            .describe("Tracker project ID to invoice"),
          dateFrom: z
            .string()
            .describe("Start date for time entries to include (YYYY-MM-DD)"),
          dateTo: z
            .string()
            .describe("End date for time entries to include (YYYY-MM-DD)"),
          currency: z
            .string()
            .optional()
            .describe(
              "Currency code override (defaults to the project's currency)",
            ),
          issueDate: z
            .string()
            .optional()
            .describe("Issue date in ISO 8601 format (defaults to today)"),
          dueDate: z
            .string()
            .optional()
            .describe(
              "Due date in ISO 8601 format (defaults to issue date + payment terms from template)",
            ),
          note: z
            .string()
            .optional()
            .describe("Plain text note to display on the invoice footer"),
          discount: z
            .number()
            .min(0)
            .optional()
            .describe("Discount amount to subtract from total"),
          includeVat: z
            .boolean()
            .optional()
            .describe(
              "Enable VAT on this invoice. Automatically enabled when vatRate > 0. Set to false to remove VAT.",
            ),
          vatRate: z
            .number()
            .min(0)
            .max(100)
            .optional()
            .describe(
              "VAT rate percentage, e.g. 25 for 25% VAT. Setting this automatically enables VAT.",
            ),
          includeTax: z
            .boolean()
            .optional()
            .describe(
              "Enable invoice-level tax. Automatically enabled when taxRate > 0. Set to false to remove tax.",
            ),
          taxRate: z
            .number()
            .min(0)
            .max(100)
            .optional()
            .describe(
              "Tax rate percentage, e.g. 10 for 10% tax. Setting this automatically enables tax.",
            ),
          includeDiscount: z
            .boolean()
            .optional()
            .describe(
              "Show the discount row on the invoice (overrides template setting)",
            ),
          includeLineItemTax: z
            .boolean()
            .optional()
            .describe(
              "Use per-line-item tax rates instead of a single invoice-level tax rate",
            ),
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        try {
          const project = await getTrackerProjectById(db, {
            id: params.projectId,
            teamId,
          });

          if (!project) {
            return {
              content: [{ type: "text", text: "Tracker project not found" }],
              isError: true,
            };
          }

          if (!project.customerId) {
            return {
              content: [
                {
                  type: "text",
                  text: "Project has no customer assigned. Assign a customer to the project first.",
                },
              ],
              isError: true,
            };
          }

          const customer = await getCustomerById(db, {
            id: project.customerId,
            teamId,
          });

          if (!customer) {
            return {
              content: [
                { type: "text", text: "Customer not found for this project" },
              ],
              isError: true,
            };
          }

          const trackerData = await getTrackerRecordsByRange(db, {
            teamId,
            from: params.dateFrom,
            to: params.dateTo,
            projectId: params.projectId,
          });

          const allEntries = Object.values(trackerData.result).flat() as any[];

          if (allEntries.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: `No time entries found for project "${project.name}" between ${params.dateFrom} and ${params.dateTo}`,
                },
              ],
              isError: true,
            };
          }

          const rate = project.rate ?? 0;
          const projectCurrency = project.currency ?? "USD";
          const currency =
            params.currency?.toUpperCase() ?? projectCurrency.toUpperCase();

          const totalDuration = allEntries.reduce(
            (sum: number, e: any) => sum + (e.duration ?? 0),
            0,
          );
          const totalHours = Math.round((totalDuration / 3600) * 100) / 100;

          const lineItems = [
            {
              name: `${project.name} — ${params.dateFrom} to ${params.dateTo} (${totalHours}h)`,
              quantity: totalHours,
              price: rate,
              unit: "hours",
              taxRate: undefined as number | undefined,
            },
          ];

          const savedTemplate = await getInvoiceTemplate(db, teamId);
          const paymentTermsDays = savedTemplate?.paymentTermsDays ?? 30;

          const mergedTemplate = {
            ...DEFAULT_TEMPLATE,
            ...Object.fromEntries(
              Object.entries(savedTemplate ?? {}).filter(([_, v]) => v != null),
            ),
            currency,
            ...(params.includeVat !== undefined
              ? { includeVat: params.includeVat }
              : {}),
            ...(params.vatRate !== undefined
              ? { vatRate: params.vatRate }
              : {}),
            ...(params.includeTax !== undefined
              ? { includeTax: params.includeTax }
              : {}),
            ...(params.taxRate !== undefined
              ? { taxRate: params.taxRate }
              : {}),
            ...(params.includeDiscount !== undefined
              ? { includeDiscount: params.includeDiscount }
              : {}),
            ...(params.includeLineItemTax !== undefined
              ? { includeLineItemTax: params.includeLineItemTax }
              : {}),
            deliveryType: "create" as const,
          };

          if (
            params.vatRate !== undefined &&
            params.vatRate > 0 &&
            params.includeVat === undefined
          ) {
            mergedTemplate.includeVat = true;
          }
          if (
            params.taxRate !== undefined &&
            params.taxRate > 0 &&
            params.includeTax === undefined
          ) {
            mergedTemplate.includeTax = true;
          }

          const invoiceNumber = await getNextInvoiceNumber(db, teamId);
          const issueDateStr = params.issueDate ?? new Date().toISOString();
          const dueDateStr =
            params.dueDate ??
            addDays(new Date(issueDateStr), paymentTermsDays).toISOString();

          const customerDetails = transformCustomerToContent(customer);
          const noteDetails =
            params.note !== undefined
              ? JSON.stringify(textToEditorDoc(params.note))
              : savedTemplate?.noteDetails
                ? JSON.stringify(savedTemplate.noteDetails)
                : null;

          const discount = params.discount ?? 0;

          const { subTotal, total, vat, tax } = calculateTotal({
            lineItems,
            taxRate: mergedTemplate.taxRate ?? 0,
            vatRate: mergedTemplate.vatRate ?? 0,
            discount,
            includeVat: mergedTemplate.includeVat ?? false,
            includeTax: mergedTemplate.includeTax ?? false,
            includeLineItemTax: mergedTemplate.includeLineItemTax ?? false,
          });

          const invoiceId = uuidv4();

          const result = await draftInvoice(db, {
            id: invoiceId,
            teamId,
            userId,
            invoiceNumber,
            issueDate: issueDateStr,
            dueDate: dueDateStr,
            templateId: savedTemplate?.id ?? null,
            template: mergedTemplate,
            customerId: customer.id,
            customerName: customer.name,
            customerDetails: customerDetails
              ? JSON.stringify(customerDetails)
              : null,
            fromDetails: savedTemplate?.fromDetails
              ? JSON.stringify(savedTemplate.fromDetails)
              : null,
            paymentDetails: savedTemplate?.paymentDetails
              ? JSON.stringify(savedTemplate.paymentDetails)
              : null,
            noteDetails,
            logoUrl: mergedTemplate.logoUrl,
            lineItems: lineItems.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              unit: item.unit ?? null,
              taxRate: item.taxRate ?? null,
            })),
            subtotal: subTotal,
            amount: total,
            vat,
            tax,
            discount: discount || null,
          });

          if (!result) {
            return {
              content: [
                { type: "text", text: "Failed to create invoice from tracker" },
              ],
              isError: true,
            };
          }

          const fresh = await getInvoiceById(db, { id: result.id, teamId });

          const pdfUrl = fresh?.token
            ? `${apiUrl}/files/download/invoice?token=${encodeURIComponent(fresh.token)}`
            : null;
          const previewUrl = fresh?.token
            ? `${DASHBOARD_URL}/i/${fresh.token}`
            : null;

          const clean = sanitize(mcpInvoiceDetailSchema, {
            ...(fresh ?? result),
            pdfUrl,
            previewUrl,
          });

          const invoiceForUI = await embedLogoAsDataUrl(clean);

          const response = {
            message: `Invoice ${invoiceNumber} created from ${totalHours}h tracked on "${project.name}". Total: ${total} ${currency}`,
            invoice: clean,
          };

          return {
            content: [{ type: "text", text: JSON.stringify(response) }],
            structuredContent: { ...response, invoice: invoiceForUI },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to create invoice from tracker",
              },
            ],
            isError: true,
          };
        }
      },
    );
  }
};
