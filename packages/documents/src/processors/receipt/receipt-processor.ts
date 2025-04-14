import { mistral } from "@ai-sdk/mistral";
import { generateObject } from "ai";
import { z } from "zod";
import type { GetDocumentRequest } from "../../types";
import { getDomainFromEmail, removeProtocolFromDomain } from "../../utils";

export class ReceiptProcessor {
  async #processDocument({ documentUrl }: GetDocumentRequest) {
    if (!documentUrl) {
      throw new Error("Document URL is required");
    }

    const result = await generateObject({
      model: mistral("mistral-small-latest"),
      schema: z.object({
        date: z
          .string()
          .describe("Date of receipt in ISO 8601 format (YYYY-MM-DD)"),
        currency: z
          .string()
          .describe(
            "Three-letter ISO 4217 currency code (e.g., USD, EUR, SEK)",
          ),
        total_amount: z.number().describe("Total amount including tax"),
        subtotal_amount: z
          .number()
          .nullable()
          .describe("Subtotal amount before tax"),
        tax_amount: z.number().nullable().describe("Tax amount"),
        store_name: z
          .string()
          .nullable()
          .describe("Name of the store/merchant"),
        website: z
          .string()
          .nullable()
          .describe(
            "Website of store/merchant (e.g., example.com), if not available use the Store Name to find the website",
          ),
        payment_method: z
          .string()
          .nullable()
          .describe("Method of payment (e.g., cash, credit card, debit card)"),
        items: z
          .array(
            z.object({
              description: z
                .string()
                .nullable()
                .describe("Description of the item"),
              quantity: z.number().nullable().describe("Quantity of items"),
              unit_price: z.number().nullable().describe("Price per unit"),
              total_price: z
                .number()
                .nullable()
                .describe("Total price for this item"),
              discount: z
                .number()
                .nullable()
                .describe("Discount amount applied to this item if any"),
            }),
          )
          .describe("Array of items purchased"),
        cashier_name: z
          .string()
          .nullable()
          .describe("Name or ID of the cashier"),
        email: z.string().nullable().describe("Email of the store/merchant"),
        register_number: z
          .string()
          .nullable()
          .describe("POS terminal or register number"),
      }),
      messages: [
        {
          role: "system",
          content: `
            You are a multilingual document parser specialized in extracting structured data from retail receipts and point-of-sale documents.
            Focus on identifying transaction details, itemized purchases, payment information, and store details.
          `,
        },
        {
          role: "user",
          content: [
            {
              type: "image",
              image: documentUrl,
            },
          ],
        },
      ],
      providerOptions: {
        mistral: {
          documentImageLimit: 4,
        },
      },
    });

    return result.object;
  }

  #getWebsite({
    website,
    email,
  }: { website: string | null; email: string | null }) {
    if (website) {
      return website;
    }

    return removeProtocolFromDomain(getDomainFromEmail(email));
  }

  public async getReceipt(params: GetDocumentRequest) {
    const result = await this.#processDocument(params);

    const website = this.#getWebsite({
      website: result.website,
      email: result.email,
    });

    return {
      ...result,
      website,
      type: "receipt",
      date: result.date,
      amount: result.total_amount,
      currency: result.currency,
      name: result.store_name,
      metadata: {
        register_number: result.register_number,
        cashier_name: result.cashier_name,
        email: result.email,
      },
    };
  }
}
