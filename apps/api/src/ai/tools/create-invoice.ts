import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { invoiceArtifact } from "@api/ai/artifacts/invoice";
import { db } from "@midday/db/client";
import {
  draftInvoice,
  getCustomerById,
  getCustomers,
  getInvoiceTemplate,
  getNextInvoiceNumber,
  getTeamById,
} from "@midday/db/queries";
import { DEFAULT_TEMPLATE } from "@midday/invoice";
import { transformCustomerToContent } from "@midday/invoice/utils";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import { addDays } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const lineItemSchema = z.object({
  name: z.string().describe("Description of the line item"),
  quantity: z.number().describe("Quantity"),
  price: z.number().describe("Unit price"),
});

const createInvoiceSchema = z.object({
  customerName: z
    .string()
    .optional()
    .describe(
      "Customer name to search for. Omit to create a blank draft without a customer.",
    ),
  customerId: z.string().optional().describe("Customer ID if already known"),
  lineItems: z
    .array(lineItemSchema)
    .optional()
    .describe(
      "Line items for the invoice. Omit to create an empty draft that can be filled in later.",
    ),
  dueDate: z
    .string()
    .optional()
    .describe("Due date (ISO 8601). Defaults to 30 days from now."),
  currency: z
    .string()
    .optional()
    .describe("Currency code (e.g. USD, EUR). Uses team default if omitted."),
  note: z
    .string()
    .optional()
    .describe("Optional note to include on the invoice"),
});

export const createInvoiceTool = tool({
  description:
    "Create a new draft invoice. Can be called with or without a customer and line items — a blank draft is created and the user can fill in details via the canvas editor or follow-up messages.",
  inputSchema: createInvoiceSchema,
  execute: async function* (
    { customerName, customerId, lineItems, dueDate, currency, note },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;
    const scopedUserId = appContext.userId as string;
    const realUserId = scopedUserId.split(":")[0]!;

    if (!teamId) {
      yield {
        text: "Unable to create invoice: Team ID not found in context.",
      };
      return;
    }

    try {
      // 1. Resolve customer (optional)
      let resolvedCustomerId: string | null = customerId ?? null;
      let resolvedCustomerName: string | null = customerName ?? null;
      let customerContent: ReturnType<
        typeof transformCustomerToContent
      > | null = null;

      if (customerId) {
        const customer = await getCustomerById(db, {
          id: customerId,
          teamId,
        });
        if (customer) {
          resolvedCustomerId = customer.id;
          resolvedCustomerName = customer.name;
          customerContent = transformCustomerToContent(customer);
        }
      } else if (customerName) {
        const customersResult = await getCustomers(db, {
          teamId,
          q: customerName,
          pageSize: 5,
        });

        if (customersResult.data.length > 0) {
          const match = customersResult.data[0]!;
          resolvedCustomerId = match.id;
          resolvedCustomerName = match.name;

          if (customersResult.data.length > 1) {
            const names = customersResult.data.map((c) => c.name).join(", ");
            yield {
              text: `Multiple customers found: ${names}. Using "${resolvedCustomerName}".`,
            };
          }

          const fullCustomer = await getCustomerById(db, {
            id: match.id,
            teamId,
          });
          if (fullCustomer) {
            customerContent = transformCustomerToContent(fullCustomer);
          }
        } else {
          yield {
            text: `No customer found matching "${customerName}". Creating the draft without a customer — you can assign one in the editor.`,
          };
        }
      }

      // 2. Get default invoice settings (mirrors tRPC defaultSettings logic)
      const [nextInvoiceNumber, template, team] = await Promise.all([
        getNextInvoiceNumber(db, teamId),
        getInvoiceTemplate(db, teamId),
        getTeamById(db, teamId),
      ]);

      const defaultTemplate = DEFAULT_TEMPLATE;
      const locale = appContext.locale ?? "en-US";
      const timezone = appContext.timezone ?? "America/New_York";
      const invoiceCurrency =
        currency?.toUpperCase() ??
        template?.currency ??
        team?.baseCurrency ??
        defaultTemplate.currency;
      const dateFormat = template?.dateFormat ?? defaultTemplate.dateFormat;

      const savedTemplate = {
        id: template?.id,
        name: template?.name ?? "Default",
        isDefault: template?.isDefault ?? true,
        title: template?.title ?? defaultTemplate.title,
        logoUrl: template?.logoUrl ?? defaultTemplate.logoUrl,
        currency: invoiceCurrency,
        size: template?.size ?? defaultTemplate.size,
        includeTax: template?.includeTax ?? defaultTemplate.includeTax,
        includeVat: template?.includeVat ?? defaultTemplate.includeVat,
        includeDiscount:
          template?.includeDiscount ?? defaultTemplate.includeDiscount,
        includeDecimals:
          template?.includeDecimals ?? defaultTemplate.includeDecimals,
        includeUnits: template?.includeUnits ?? defaultTemplate.includeUnits,
        includeQr: template?.includeQr ?? defaultTemplate.includeQr,
        includeLineItemTax:
          template?.includeLineItemTax ?? defaultTemplate.includeLineItemTax,
        lineItemTaxLabel:
          template?.lineItemTaxLabel ?? defaultTemplate.lineItemTaxLabel,
        includePdf: template?.includePdf ?? defaultTemplate.includePdf,
        customerLabel: template?.customerLabel ?? defaultTemplate.customerLabel,
        fromLabel: template?.fromLabel ?? defaultTemplate.fromLabel,
        invoiceNoLabel:
          template?.invoiceNoLabel ?? defaultTemplate.invoiceNoLabel,
        subtotalLabel: template?.subtotalLabel ?? defaultTemplate.subtotalLabel,
        issueDateLabel:
          template?.issueDateLabel ?? defaultTemplate.issueDateLabel,
        totalSummaryLabel:
          template?.totalSummaryLabel ?? defaultTemplate.totalSummaryLabel,
        dueDateLabel: template?.dueDateLabel ?? defaultTemplate.dueDateLabel,
        discountLabel: template?.discountLabel ?? defaultTemplate.discountLabel,
        descriptionLabel:
          template?.descriptionLabel ?? defaultTemplate.descriptionLabel,
        priceLabel: template?.priceLabel ?? defaultTemplate.priceLabel,
        quantityLabel: template?.quantityLabel ?? defaultTemplate.quantityLabel,
        totalLabel: template?.totalLabel ?? defaultTemplate.totalLabel,
        vatLabel: template?.vatLabel ?? defaultTemplate.vatLabel,
        taxLabel: template?.taxLabel ?? defaultTemplate.taxLabel,
        paymentLabel: template?.paymentLabel ?? defaultTemplate.paymentLabel,
        noteLabel: template?.noteLabel ?? defaultTemplate.noteLabel,
        dateFormat,
        deliveryType: template?.deliveryType ?? defaultTemplate.deliveryType,
        taxRate: template?.taxRate ?? defaultTemplate.taxRate,
        vatRate: template?.vatRate ?? defaultTemplate.vatRate,
        fromDetails: template?.fromDetails ?? defaultTemplate.fromDetails,
        paymentDetails:
          template?.paymentDetails ?? defaultTemplate.paymentDetails,
        noteDetails: template?.noteDetails ?? defaultTemplate.noteDetails,
        timezone,
        locale,
        paymentEnabled:
          template?.paymentEnabled ?? defaultTemplate.paymentEnabled,
        paymentTermsDays: template?.paymentTermsDays ?? 30,
      };

      // 3. Build invoice data
      const invoiceId = uuidv4();
      const paymentTermsDays = savedTemplate.paymentTermsDays ?? 30;
      const issueDate = new Date().toISOString();
      const resolvedDueDate =
        dueDate ?? addDays(new Date(), paymentTermsDays).toISOString();

      // Use provided line items or default to a single empty row
      const invoiceLineItems =
        lineItems && lineItems.length > 0
          ? lineItems.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              vat: 0,
            }))
          : [{ name: "", quantity: 0, price: 0, vat: 0 }];

      const subtotal =
        lineItems && lineItems.length > 0
          ? lineItems.reduce((sum, item) => sum + item.quantity * item.price, 0)
          : 0;
      const amount = subtotal;

      // 4. Stream artifact to canvas (creating stage)
      const writer = getWriter(executionOptions);
      const artifactStream = invoiceArtifact.stream(
        {
          stage: "creating",
          invoiceId,
          version: 1,
          summary: {
            invoiceNumber: nextInvoiceNumber,
            customerName: resolvedCustomerName ?? "",
            amount,
            currency: invoiceCurrency,
            lineItems: (lineItems ?? []).map((item) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
            dueDate: resolvedDueDate,
            status: "draft",
          },
        },
        writer,
      );

      // 5. Create draft invoice in DB
      const {
        paymentDetails: _tp,
        fromDetails: _tf,
        ...restTemplate
      } = savedTemplate;

      await draftInvoice(db, {
        id: invoiceId,
        teamId,
        userId: realUserId,
        templateId: template?.id ?? null,
        template: restTemplate as any,
        invoiceNumber: nextInvoiceNumber,
        issueDate,
        dueDate: resolvedDueDate,
        customerId: resolvedCustomerId,
        customerName: resolvedCustomerName,
        customerDetails: customerContent
          ? JSON.stringify(customerContent)
          : null,
        fromDetails: savedTemplate.fromDetails
          ? JSON.stringify(savedTemplate.fromDetails)
          : null,
        paymentDetails: savedTemplate.paymentDetails
          ? JSON.stringify(savedTemplate.paymentDetails)
          : null,
        noteDetails: note
          ? JSON.stringify({
              type: "doc",
              content: [
                {
                  type: "paragraph",
                  content: [{ text: note, type: "text" }],
                },
              ],
            })
          : savedTemplate.noteDetails
            ? JSON.stringify(savedTemplate.noteDetails)
            : null,
        lineItems: invoiceLineItems,
        subtotal,
        amount,
      });

      // 6. Update artifact to created stage
      await artifactStream.update({
        stage: "created",
        invoiceId,
        version: 1,
        summary: {
          invoiceNumber: nextInvoiceNumber,
          customerName: resolvedCustomerName ?? "",
          amount,
          currency: invoiceCurrency,
          lineItems: (lineItems ?? []).map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          dueDate: resolvedDueDate,
          status: "draft",
        },
      });

      // 7. Yield text summary
      const locale2 = appContext.locale ?? "en-US";
      const hasCustomer = !!resolvedCustomerName;
      const hasLineItems = lineItems && lineItems.length > 0;

      let responseText = `Draft invoice **${nextInvoiceNumber}** created`;

      if (hasCustomer) {
        responseText += ` for **${resolvedCustomerName}**`;
      }

      if (hasLineItems) {
        const formattedAmount = formatAmount({
          amount,
          currency: invoiceCurrency,
          locale: locale2,
        });

        const lineItemsSummary = lineItems
          .map(
            (item) =>
              `${item.name} (${item.quantity} x ${formatAmount({ amount: item.price, currency: invoiceCurrency, locale: locale2 })})`,
          )
          .join(", ");

        responseText += ` — **${formattedAmount}**.\n\nLine items: ${lineItemsSummary}`;
      } else {
        responseText += ".";
      }

      // Build contextual next-step hints based on what's missing
      const missing: string[] = [];
      if (!hasCustomer) missing.push("a customer");
      if (!hasLineItems) missing.push("line items");

      if (missing.length > 0) {
        responseText += `\n\nWhat would you like to add first? You still need ${missing.join(" and ")}.`;
      } else {
        responseText +=
          "\n\nWant me to adjust anything — add more items, change the due date, apply a discount?";
      }

      yield { text: responseText };
    } catch (error) {
      yield {
        text: `Failed to create invoice: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
