import { mistral } from "@ai-sdk/mistral";
import { generateObject } from "ai";
import { z } from "zod";
import type { GetDocumentRequest } from "../../types";
import { getDomainFromEmail, removeProtocolFromDomain } from "../../utils";

export class InvoiceProcessor {
  async #processDocument({ documentUrl }: GetDocumentRequest) {
    if (!documentUrl) {
      throw new Error("Document URL is required");
    }

    const result = await generateObject({
      model: mistral("mistral-small-latest"),
      schema: z.object({
        invoice_number: z
          .string()
          .nullable()
          .describe("Unique identifier for the invoice"),
        invoice_date: z
          .string()
          .nullable()
          .describe("Date of invoice in ISO 8601 format (YYYY-MM-DD)"),
        due_date: z
          .string()
          .describe("Payment due date in ISO 8601 format (YYYY-MM-DD)"),
        currency: z
          .string()
          .describe(
            "Three-letter ISO 4217 currency code (e.g., USD, EUR, SEK)",
          ),
        total_amount: z.number().describe("Total amount for the invoice"),
        vendor_name: z
          .string()
          .nullable()
          .describe("Name of the vendor/seller"),
        vendor_address: z
          .string()
          .nullable()
          .describe("Complete address of the vendor"),
        customer_name: z
          .string()
          .nullable()
          .describe("Name of the customer/buyer"),
        customer_address: z
          .string()
          .nullable()
          .describe("Complete address of the customer"),
        website: z
          .string()
          .nullable()
          .describe(
            "The root domain name of the vendor (e.g., 'example.com', not 'www.example.com' or 'shop.example.com'). If not explicitly mentioned in the document, infer it from the vendor's email address or search online using the Vendor Name. Prioritize the root domain.",
          ),
        email: z.string().nullable().describe("Email of the vendor/seller"),
        line_items: z
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
                .describe("Total price for this line item"),
            }),
          )
          .describe("Array of items listed in the document"),
        payment_instructions: z
          .string()
          .nullable()
          .describe("Payment terms or instructions"),
        notes: z.string().nullable().describe("Additional notes or comments"),
      }),
      messages: [
        {
          role: "system",
          content: `
            You are a multilingual document parser that extracts structured data from financial documents such as invoices and receipts.
          `,
        },
        {
          role: "user",
          content: [
            {
              type: "file",
              data: documentUrl,
              mimeType: "application/pdf",
            },
          ],
        },
      ],
      providerOptions: {
        mistral: {
          documentPageLimit: 10,
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

  public async getInvoice(params: GetDocumentRequest) {
    const result = await this.#processDocument(params);

    const website = this.#getWebsite({
      website: result.website,
      email: result.email,
    });

    return {
      ...result,
      website,
      type: "invoice",
      description: result.notes,
      date: result.due_date,
      amount: result.total_amount,
      currency: result.currency,
      name: result.vendor_name,
      metadata: {
        invoice_date: result.invoice_date,
        payment_instructions: result.payment_instructions,
        invoice_number: result.invoice_number,
        customer_name: result.customer_name,
        customer_address: result.customer_address,
        vendor_address: result.vendor_address,
        vendor_name: result.vendor_name,
        email: result.email,
      },
    };
  }
}
