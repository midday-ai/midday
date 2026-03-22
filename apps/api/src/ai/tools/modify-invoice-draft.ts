import type { AppContext } from "@api/ai/context";
import { db } from "@midday/db/client";
import { draftInvoice, getInvoiceById } from "@midday/db/queries";
import { tool } from "ai";
import { z } from "zod";

const lineItemSchema = z.object({
  name: z.string().describe("Description / name of the line item"),
  quantity: z.number().default(1).describe("Quantity (default 1)"),
  price: z.number().describe("Unit price"),
  unit: z.string().optional().describe("Unit label, e.g. 'hours', 'pcs'"),
  tax: z.number().optional().describe("Tax rate for this line item (%)"),
});

const modifyInvoiceDraftSchema = z.object({
  addLineItems: z
    .array(lineItemSchema)
    .optional()
    .describe("Line items to append to the invoice"),
  removeLineItemByName: z
    .string()
    .optional()
    .describe("Remove the first line item whose name contains this text"),
  dueDate: z
    .string()
    .optional()
    .describe("New due date in ISO-8601 format (YYYY-MM-DD)"),
  issueDate: z
    .string()
    .optional()
    .describe("New issue date in ISO-8601 format (YYYY-MM-DD)"),
  noteDetails: z
    .string()
    .optional()
    .describe("Note / memo to set on the invoice"),
  discount: z.number().optional().describe("Discount amount"),
  tax: z.number().optional().describe("Tax amount"),
  currency: z.string().optional().describe("Currency code (e.g. USD, EUR)"),
});

export const modifyInvoiceDraftTool = tool({
  description:
    "Modify the currently open invoice draft. Use ONLY when the user already has an invoice open in the canvas (invoiceId is present in context). Can add/remove line items, change dates, notes, discount, and tax. Returns refresh_invoice so the form reloads.",
  inputSchema: modifyInvoiceDraftSchema,
  async execute(input, executionOptions) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;
    const userId = appContext.userId?.split(":")[0] as string;
    const invoiceId = appContext.invoiceId;

    if (!invoiceId) {
      return {
        error:
          "No invoice is currently open. Use createInvoice to open one first.",
      };
    }

    if (!teamId) {
      return { error: "No team context" };
    }

    try {
      const invoice = await getInvoiceById(db, { id: invoiceId, teamId });

      if (!invoice) {
        return { error: "Invoice not found" };
      }

      if (invoice.status !== "draft") {
        return {
          error: `Cannot modify an invoice with status "${invoice.status}". Only draft invoices can be edited.`,
        };
      }

      let lineItems = (
        Array.isArray(invoice.lineItems) ? invoice.lineItems : []
      ) as Array<{
        name?: string | null;
        quantity?: number;
        price?: number;
        unit?: string | null;
        vat?: number | null;
        tax?: number | null;
      }>;

      if (input.removeLineItemByName) {
        const needle = input.removeLineItemByName.toLowerCase();
        const idx = lineItems.findIndex((item) =>
          (item.name ?? "").toLowerCase().includes(needle),
        );
        if (idx !== -1) {
          lineItems = [...lineItems.slice(0, idx), ...lineItems.slice(idx + 1)];
        }
      }

      if (input.addLineItems) {
        for (const item of input.addLineItems) {
          lineItems.push({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            unit: item.unit ?? null,
            tax: item.tax ?? null,
            vat: null,
          });
        }
      }

      const subtotal = lineItems.reduce(
        (sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 1),
        0,
      );

      const taxAmount = input.tax ?? (invoice.tax as number | null) ?? 0;
      const discountAmount =
        input.discount ?? (invoice.discount as number | null) ?? 0;
      const amount = subtotal + taxAmount - discountAmount;

      await draftInvoice(db, {
        id: invoiceId,
        teamId,
        userId,
        dueDate: input.dueDate ?? invoice.dueDate ?? new Date().toISOString(),
        issueDate:
          input.issueDate ?? invoice.issueDate ?? new Date().toISOString(),
        invoiceNumber: invoice.invoiceNumber ?? "",
        lineItems,
        subtotal,
        amount,
        tax: input.tax ?? (invoice.tax as number | null),
        discount: input.discount ?? (invoice.discount as number | null),
        noteDetails:
          input.noteDetails ?? (invoice.noteDetails as string | null),
        customerDetails: invoice.customerDetails as string | null,
        customerId: invoice.customerId ?? null,
        customerName: invoice.customerName ?? null,
        paymentDetails: invoice.paymentDetails as string | null,
        fromDetails: invoice.fromDetails as string | null,
        vat: invoice.vat as number | null,
        topBlock: invoice.topBlock as string | null,
        bottomBlock: invoice.bottomBlock as string | null,
        token: invoice.token ?? undefined,
        templateId: invoice.templateId ?? null,
        template: {
          ...(typeof invoice.template === "object" && invoice.template !== null
            ? (invoice.template as Record<string, unknown>)
            : {}),
          ...(input.currency && { currency: input.currency }),
        },
      });

      return {
        action: "refresh_invoice" as const,
        invoiceId,
      };
    } catch (e) {
      return {
        error: `Failed to modify invoice: ${e instanceof Error ? e.message : "Unknown error"}`,
      };
    }
  },
});
