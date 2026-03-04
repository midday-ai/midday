import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { invoiceArtifact } from "@api/ai/artifacts/invoice";
import { db } from "@midday/db/client";
import {
  draftInvoice,
  getCustomerById,
  getCustomers,
  getInvoiceById,
} from "@midday/db/queries";
import { transformCustomerToContent } from "@midday/invoice/utils";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import { z } from "zod";

const lineItemSchema = z.object({
  name: z.string().describe("Description of the line item"),
  quantity: z.number().describe("Quantity"),
  price: z.number().describe("Unit price"),
});

const updateInvoiceSchema = z.object({
  invoiceId: z.string().describe("Invoice ID to update"),
  customerName: z
    .string()
    .optional()
    .describe("New customer name (searches existing customers)"),
  addLineItems: z
    .array(lineItemSchema)
    .optional()
    .describe("Line items to add to the existing ones"),
  removeLineItemIndex: z
    .number()
    .optional()
    .describe("Index of line item to remove (0-based)"),
  replaceLineItems: z
    .array(lineItemSchema)
    .optional()
    .describe("Replace all line items with these"),
  dueDate: z.string().optional().describe("New due date (ISO 8601)"),
  issueDate: z.string().optional().describe("New issue date (ISO 8601)"),
  discount: z.number().optional().describe("Discount amount"),
  tax: z.number().optional().describe("Tax amount"),
  vat: z.number().optional().describe("VAT amount"),
  note: z.string().optional().describe("Invoice note"),
  currency: z.string().optional().describe("Currency code"),
});

export const updateInvoiceTool = tool({
  description:
    "Update an existing draft invoice. Supports changing customer, adding/removing/replacing line items, dates, discount, tax, and notes.",
  inputSchema: updateInvoiceSchema,
  execute: async function* (input, executionOptions) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;
    const scopedUserId = appContext.userId as string;
    const realUserId = scopedUserId.split(":")[0]!;

    if (!teamId) {
      yield {
        text: "Unable to update invoice: Team ID not found in context.",
      };
      return;
    }

    try {
      // 1. Fetch existing invoice
      const existing = await getInvoiceById(db, {
        id: input.invoiceId,
        teamId,
      });

      if (!existing) {
        yield {
          text: `Invoice not found with ID "${input.invoiceId}". Please check the ID.`,
        };
        return;
      }

      if (existing.status !== "draft") {
        yield {
          text: `Invoice ${existing.invoiceNumber} has status "${existing.status}" and cannot be edited. Only draft invoices can be modified.`,
        };
        return;
      }

      // Stream artifact (updating stage)
      const writer = getWriter(executionOptions);
      const existingLineItems = (existing.lineItems as any[]) ?? [];
      const artifactStream = invoiceArtifact.stream(
        {
          stage: "updating",
          invoiceId: input.invoiceId,
          version: Date.now(),
          summary: {
            invoiceNumber: existing.invoiceNumber ?? "Draft",
            customerName: existing.customerName ?? "Unknown",
            amount: existing.amount ?? 0,
            currency: existing.currency ?? "USD",
            lineItems: existingLineItems.map((item: any) => ({
              name: item.name ?? "",
              quantity: item.quantity ?? 0,
              price: item.price ?? 0,
            })),
            dueDate: existing.dueDate?.toISOString() ?? "",
            status: existing.status ?? "draft",
          },
        },
        writer,
      );

      const changes: string[] = [];

      // 2. Resolve customer change
      let customerId = existing.customerId;
      let customerName = existing.customerName;
      let customerDetails = existing.customerDetails;

      if (input.customerName) {
        const customersResult = await getCustomers(db, {
          teamId,
          q: input.customerName,
          pageSize: 5,
        });

        if (customersResult.data.length === 0) {
          yield {
            text: `No customer found matching "${input.customerName}".`,
          };
          return;
        }

        const match = customersResult.data[0]!;
        customerId = match.id;
        customerName = match.name;

        const fullCustomer = await getCustomerById(db, {
          id: match.id,
          teamId,
        });

        if (fullCustomer) {
          customerDetails = JSON.stringify(
            transformCustomerToContent(fullCustomer),
          ) as any;
        }

        changes.push(`Customer changed to **${customerName}**`);
      }

      // 3. Resolve line items
      let lineItems = existingLineItems.map((item: any) => ({
        name: item.name as string,
        quantity: item.quantity as number,
        price: item.price as number,
        vat: (item.vat as number) ?? 0,
      }));

      if (input.replaceLineItems) {
        lineItems = input.replaceLineItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          vat: 0,
        }));
        changes.push(
          `Replaced all line items (${input.replaceLineItems.length} items)`,
        );
      } else {
        if (
          input.removeLineItemIndex !== undefined &&
          input.removeLineItemIndex >= 0 &&
          input.removeLineItemIndex < lineItems.length
        ) {
          const removed = lineItems[input.removeLineItemIndex];
          lineItems.splice(input.removeLineItemIndex, 1);
          changes.push(`Removed line item "${removed?.name}"`);
        }

        if (input.addLineItems && input.addLineItems.length > 0) {
          for (const item of input.addLineItems) {
            lineItems.push({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              vat: 0,
            });
          }
          const added = input.addLineItems.map((i) => `"${i.name}"`).join(", ");
          changes.push(`Added line items: ${added}`);
        }
      }

      // 4. Calculate totals
      const subtotal = lineItems.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0,
      );
      const discount = input.discount ?? existing.discount ?? 0;
      const tax = input.tax ?? existing.tax ?? 0;
      const vat = input.vat ?? existing.vat ?? 0;
      const amount = subtotal - discount + tax + vat;

      if (input.discount !== undefined) {
        changes.push(`Discount set to ${input.discount}`);
      }
      if (input.tax !== undefined) {
        changes.push(`Tax set to ${input.tax}`);
      }
      if (input.vat !== undefined) {
        changes.push(`VAT set to ${input.vat}`);
      }

      const resolvedDueDate =
        input.dueDate ?? existing.dueDate?.toISOString() ?? "";
      const resolvedIssueDate =
        input.issueDate ?? existing.issueDate?.toISOString() ?? "";
      const resolvedCurrency =
        input.currency?.toUpperCase() ?? existing.currency ?? "USD";

      if (input.dueDate) {
        changes.push(`Due date updated`);
      }
      if (input.issueDate) {
        changes.push(`Issue date updated`);
      }
      if (input.currency) {
        changes.push(`Currency changed to ${resolvedCurrency}`);
      }

      // 5. Build note details
      let noteDetails = existing.noteDetails;
      if (input.note !== undefined) {
        noteDetails = JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ text: input.note, type: "text" }],
            },
          ],
        }) as any;
        changes.push("Note updated");
      }

      // 6. Persist the updated draft
      await draftInvoice(db, {
        id: input.invoiceId,
        teamId,
        userId: realUserId,
        templateId: existing.templateId ?? null,
        template: (existing.template ?? {}) as any,
        invoiceNumber: existing.invoiceNumber ?? "",
        issueDate: resolvedIssueDate,
        dueDate: resolvedDueDate,
        customerId: customerId ?? null,
        customerName: customerName ?? null,
        customerDetails: customerDetails
          ? typeof customerDetails === "string"
            ? customerDetails
            : JSON.stringify(customerDetails)
          : null,
        fromDetails: existing.fromDetails
          ? typeof existing.fromDetails === "string"
            ? existing.fromDetails
            : JSON.stringify(existing.fromDetails)
          : null,
        paymentDetails: existing.paymentDetails
          ? typeof existing.paymentDetails === "string"
            ? existing.paymentDetails
            : JSON.stringify(existing.paymentDetails)
          : null,
        noteDetails: noteDetails
          ? typeof noteDetails === "string"
            ? noteDetails
            : JSON.stringify(noteDetails)
          : null,
        lineItems,
        subtotal,
        discount,
        tax,
        vat,
        amount,
        token: existing.token ?? undefined,
      });

      // 7. Update artifact to "updated" stage
      await artifactStream.update({
        stage: "updated",
        invoiceId: input.invoiceId,
        version: Date.now(),
        summary: {
          invoiceNumber: existing.invoiceNumber ?? "Draft",
          customerName: customerName ?? "Unknown",
          amount,
          currency: resolvedCurrency,
          lineItems: lineItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          dueDate: resolvedDueDate,
          status: "draft",
        },
      });

      // 8. Yield confirmation
      const locale = appContext.locale ?? "en-US";
      const formattedAmount = formatAmount({
        amount,
        currency: resolvedCurrency,
        locale,
      });

      const changesList =
        changes.length > 0
          ? changes.map((c) => `- ${c}`).join("\n")
          : "- No changes detected";

      yield {
        text: `Invoice **${existing.invoiceNumber}** updated — **${formattedAmount}**.\n\nChanges:\n${changesList}`,
      };
    } catch (error) {
      yield {
        text: `Failed to update invoice: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
