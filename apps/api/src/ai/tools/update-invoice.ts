import type { AppContext } from "@api/ai/context";
import { db } from "@midday/db/client";
import { getInvoices } from "@midday/db/queries";
import { tool } from "ai";
import { z } from "zod";

const updateInvoiceSchema = z.object({
  invoiceNumber: z
    .string()
    .optional()
    .describe("Invoice number to look up (e.g., INV-001)"),
  customerName: z
    .string()
    .optional()
    .describe("Customer name to find the invoice for"),
});

export const updateInvoiceTool = tool({
  description:
    "Open an existing draft invoice for editing. Use when the user wants to edit, update, or modify an existing invoice. Searches by invoice number or customer name.",
  inputSchema: updateInvoiceSchema,
  async execute({ invoiceNumber, customerName }, executionOptions) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      return { error: "No team context" };
    }

    try {
      const result = await getInvoices(db, {
        teamId,
        sort: ["createdAt", "desc"],
        pageSize: 10,
        statuses: ["draft"],
        q: invoiceNumber || customerName || null,
      });

      const first = result.data?.[0];
      if (!first) {
        return { error: "No matching draft invoices found" };
      }

      let invoice = first;

      if (invoiceNumber) {
        const exactMatch = result.data.find(
          (inv) =>
            inv.invoiceNumber?.toLowerCase() === invoiceNumber.toLowerCase(),
        );
        if (exactMatch) invoice = exactMatch;
      }

      if (customerName && !invoiceNumber) {
        const nameMatch = result.data.find((inv) =>
          inv.customerName?.toLowerCase().includes(customerName.toLowerCase()),
        );
        if (nameMatch) invoice = nameMatch;
      }

      return {
        action: "open_invoice_sheet" as const,
        params: {
          type: "edit" as const,
          invoiceId: invoice.id,
        },
      };
    } catch {
      return { error: "Search failed" };
    }
  },
});
