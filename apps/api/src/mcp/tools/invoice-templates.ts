import {
  getInvoiceTemplate,
  getInvoiceTemplateById,
  getInvoiceTemplates,
  upsertInvoiceTemplate,
} from "@midday/db/queries";
import { z } from "zod";
import { mcpInvoiceTemplateSchema, sanitize, sanitizeArray } from "../schemas";
import {
  hasScope,
  READ_ONLY_ANNOTATIONS,
  type RegisterTools,
  WRITE_ANNOTATIONS,
} from "../types";
import {
  DASHBOARD_URL,
  textToEditorDoc,
  truncateListResponse,
  withErrorHandling,
} from "../utils";

export const registerInvoiceTemplateTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  const hasReadScope = hasScope(ctx, "invoices.read");
  const hasWriteScope = hasScope(ctx, "invoices.write");

  if (!hasReadScope && !hasWriteScope) {
    return;
  }

  if (hasReadScope) {
    server.registerTool(
      "invoice_template_list",
      {
        title: "List Invoice Templates",
        description:
          "List all invoice templates for the team. Returns template names, labels, and settings. Use this to see available templates before updating one.",
        inputSchema: {},
        annotations: READ_ONLY_ANNOTATIONS,
      },
      withErrorHandling(async () => {
        const templates = await getInvoiceTemplates(db, teamId);

        const clean = sanitizeArray(mcpInvoiceTemplateSchema, templates);

        const response = {
          meta: { cursor: null, hasNextPage: false },
          data: clean,
        };

        const { text, structuredContent } = truncateListResponse(response);

        return {
          content: [{ type: "text" as const, text }],
          structuredContent,
        };
      }, "Failed to list invoice templates"),
    );

    server.registerTool(
      "invoice_template_get",
      {
        title: "Get Invoice Template",
        description:
          "Get an invoice template by ID, or the default template if no ID is provided. Returns all labels (title, customerLabel, invoiceNoLabel, vatLabel, etc.) and settings (currency, tax rates, delivery type, etc.).",
        inputSchema: {
          id: z
            .string()
            .uuid()
            .optional()
            .describe(
              "Template ID. If omitted, returns the default (or first) template.",
            ),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      withErrorHandling(async (params) => {
        const template = params.id
          ? await getInvoiceTemplateById(db, { id: params.id, teamId })
          : await getInvoiceTemplate(db, teamId);

        if (!template) {
          return {
            content: [
              {
                type: "text" as const,
                text: params.id
                  ? `Invoice template not found (id: ${params.id})`
                  : "No invoice template found for this team",
              },
            ],
            isError: true,
          };
        }

        const clean = sanitize(mcpInvoiceTemplateSchema, template);

        const response = {
          ...clean,
          previewUrl: `${DASHBOARD_URL}/invoices`,
        };

        return {
          content: [{ type: "text" as const, text: JSON.stringify(response) }],
        };
      }, "Failed to get invoice template"),
    );
  }

  if (hasWriteScope) {
    server.registerTool(
      "invoice_template_update",
      {
        title: "Update Invoice Template",
        description:
          "Update an invoice template's labels and settings. Changes here affect all future invoices using this template. You can change labels (title, customerLabel, invoiceNoLabel, issueDateLabel, dueDateLabel, vatLabel, taxLabel, subtotalLabel, totalLabel, etc.), display settings (currency, dateFormat, size, includeVat, includeTax, includeDiscount, etc.), tax rates, email settings, and template content (fromDetails for sender/company info, paymentDetails for bank info, noteDetails for default footer note — all accept plain text). If no template ID is provided, updates the default template.",
        inputSchema: {
          id: z
            .string()
            .uuid()
            .optional()
            .describe(
              "Template ID to update. If omitted, updates the default template.",
            ),
          title: z
            .string()
            .optional()
            .describe('Invoice title label, e.g. "Invoice" or "Faktura"'),
          customerLabel: z
            .string()
            .optional()
            .describe('Customer section label, e.g. "To" or "Till"'),
          fromLabel: z
            .string()
            .optional()
            .describe('Sender section label, e.g. "From" or "Från"'),
          invoiceNoLabel: z
            .string()
            .optional()
            .describe(
              'Invoice number label, e.g. "Invoice No" or "Fakturanummer"',
            ),
          issueDateLabel: z
            .string()
            .optional()
            .describe('Issue date label, e.g. "Issue Date" or "Fakturadatum"'),
          dueDateLabel: z
            .string()
            .optional()
            .describe('Due date label, e.g. "Due Date" or "Förfallodag"'),
          descriptionLabel: z
            .string()
            .optional()
            .describe(
              'Line item description column label, e.g. "Description" or "Beskrivning"',
            ),
          priceLabel: z
            .string()
            .optional()
            .describe('Price column label, e.g. "Price" or "Pris"'),
          quantityLabel: z
            .string()
            .optional()
            .describe('Quantity column label, e.g. "Quantity" or "Antal"'),
          totalLabel: z
            .string()
            .optional()
            .describe('Line item total column label, e.g. "Total" or "Summa"'),
          totalSummaryLabel: z
            .string()
            .optional()
            .describe('Grand total label, e.g. "Total"'),
          subtotalLabel: z
            .string()
            .optional()
            .describe('Subtotal label, e.g. "Subtotal" or "Delsumma"'),
          vatLabel: z
            .string()
            .optional()
            .describe('VAT label, e.g. "VAT" or "Moms"'),
          taxLabel: z
            .string()
            .optional()
            .describe('Tax label, e.g. "Tax" or "Skatt"'),
          discountLabel: z
            .string()
            .optional()
            .describe('Discount label, e.g. "Discount" or "Rabatt"'),
          paymentLabel: z
            .string()
            .optional()
            .describe(
              'Payment details section label, e.g. "Payment Details" or "Betalningsuppgifter"',
            ),
          noteLabel: z
            .string()
            .optional()
            .describe('Note section label, e.g. "Note" or "Anteckning"'),
          lineItemTaxLabel: z
            .string()
            .optional()
            .describe('Per-line-item tax column label, e.g. "Tax"'),
          currency: z
            .string()
            .optional()
            .describe("Default currency code, e.g. USD, EUR, SEK"),
          dateFormat: z
            .string()
            .optional()
            .describe(
              'Date format string, e.g. "dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"',
            ),
          size: z.enum(["a4", "letter"]).optional().describe("Paper size"),
          includeVat: z.boolean().optional().describe("Show VAT on invoices"),
          vatRate: z
            .number()
            .min(0)
            .max(100)
            .optional()
            .describe("Default VAT rate percentage"),
          includeTax: z.boolean().optional().describe("Show tax on invoices"),
          taxRate: z
            .number()
            .min(0)
            .max(100)
            .optional()
            .describe("Default tax rate percentage"),
          includeDiscount: z
            .boolean()
            .optional()
            .describe("Show discount row on invoices"),
          includeDecimals: z
            .boolean()
            .optional()
            .describe("Show decimal places in amounts"),
          includeUnits: z
            .boolean()
            .optional()
            .describe("Show unit column on line items"),
          includeQr: z
            .boolean()
            .optional()
            .describe("Include QR code on invoices"),
          includeLineItemTax: z
            .boolean()
            .optional()
            .describe("Use per-line-item tax rates instead of invoice-level"),
          includePdf: z
            .boolean()
            .optional()
            .describe("Attach PDF when emailing invoices"),
          sendCopy: z
            .boolean()
            .optional()
            .describe("Send a copy to the invoice creator when emailing"),
          deliveryType: z
            .enum(["create", "create_and_send", "scheduled"])
            .optional()
            .describe("Default delivery type for new invoices"),
          paymentEnabled: z
            .boolean()
            .optional()
            .describe("Enable online payment for invoices"),
          paymentTermsDays: z
            .number()
            .min(0)
            .max(365)
            .optional()
            .describe("Default payment terms in days"),
          emailSubject: z
            .string()
            .optional()
            .nullable()
            .describe("Custom email subject line when sending invoices"),
          emailHeading: z
            .string()
            .optional()
            .nullable()
            .describe("Custom email heading"),
          emailBody: z
            .string()
            .optional()
            .nullable()
            .describe("Custom email body text"),
          emailButtonText: z
            .string()
            .optional()
            .nullable()
            .describe('Custom email button text, e.g. "View Invoice"'),
          fromDetails: z
            .string()
            .optional()
            .nullable()
            .describe(
              "Sender/company details shown on invoices (plain text, line breaks preserved). e.g. company name, address, tax ID.",
            ),
          paymentDetails: z
            .string()
            .optional()
            .nullable()
            .describe(
              "Payment details shown on invoices (plain text, line breaks preserved). e.g. bank name, account number, IBAN.",
            ),
          noteDetails: z
            .string()
            .optional()
            .nullable()
            .describe(
              "Default footer note for new invoices (plain text, line breaks preserved). e.g. thank you message, terms.",
            ),
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        try {
          const {
            id,
            fromDetails,
            paymentDetails,
            noteDetails,
            ...updateFields
          } = params;

          const allFields = {
            ...updateFields,
            ...(fromDetails !== undefined
              ? {
                  fromDetails:
                    fromDetails === null
                      ? null
                      : JSON.stringify(textToEditorDoc(fromDetails)),
                }
              : {}),
            ...(paymentDetails !== undefined
              ? {
                  paymentDetails:
                    paymentDetails === null
                      ? null
                      : JSON.stringify(textToEditorDoc(paymentDetails)),
                }
              : {}),
            ...(noteDetails !== undefined
              ? {
                  noteDetails:
                    noteDetails === null
                      ? null
                      : JSON.stringify(textToEditorDoc(noteDetails)),
                }
              : {}),
          };

          const hasUpdates = Object.values(allFields).some(
            (v) => v !== undefined,
          );

          if (!hasUpdates) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: "No fields provided to update. Specify at least one label or setting to change.",
                },
              ],
              isError: true,
            };
          }

          const result = await upsertInvoiceTemplate(db, {
            id,
            teamId,
            ...allFields,
          });

          if (!result) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: "Failed to update invoice template",
                },
              ],
              isError: true,
            };
          }

          const clean = sanitize(mcpInvoiceTemplateSchema, result);

          const changedFields = Object.keys(allFields).filter(
            (k) => allFields[k as keyof typeof allFields] !== undefined,
          );

          const response = {
            message: `Invoice template "${result.name}" updated. Changed: ${changedFields.join(", ")}`,
            template: clean,
            previewUrl: `${DASHBOARD_URL}/invoices`,
          };

          return {
            content: [
              { type: "text" as const, text: JSON.stringify(response) },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text" as const,
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to update invoice template",
              },
            ],
            isError: true,
          };
        }
      },
    );
  }
};
