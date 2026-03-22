import type { AppContext } from "@api/ai/context";
import { db } from "@midday/db/client";
import { getCustomers } from "@midday/db/queries";
import { tool } from "ai";
import { z } from "zod";

const createInvoiceSchema = z.object({
  customerName: z
    .string()
    .optional()
    .describe("Customer name to search for and pre-fill"),
  amount: z.number().optional().describe("Pre-fill amount if mentioned"),
  currency: z
    .string()
    .optional()
    .describe("Currency code for the invoice (e.g., USD, EUR)"),
});

export const createInvoiceTool = tool({
  description:
    "Open the invoice creation form. Use when the user wants to create a new invoice. If a customer name is mentioned, it will be looked up and pre-filled.",
  inputSchema: createInvoiceSchema,
  async execute({ customerName, amount, currency }, executionOptions) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    let customerId: string | undefined;

    if (customerName && teamId) {
      try {
        const result = await getCustomers(db, {
          teamId,
          q: customerName,
          cursor: null,
          sort: null,
          pageSize: 5,
        });

        if (result.data.length > 0) {
          const match =
            result.data.find(
              (c) => c.name.toLowerCase() === customerName.toLowerCase(),
            ) ?? result.data[0];

          if (match) {
            customerId = match.id;
          }
        }
      } catch {
        // Customer lookup failed — continue without pre-fill
      }
    }

    return {
      action: "open_invoice_sheet" as const,
      params: {
        type: "create" as const,
        ...(customerId && { customerId }),
        ...(customerName && !customerId && { customerName }),
        ...(amount && { amount }),
        ...(currency && { currency }),
      },
    };
  },
});
