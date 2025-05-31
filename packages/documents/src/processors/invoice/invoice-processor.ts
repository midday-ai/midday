import { mistral } from "@ai-sdk/mistral";
import { generateObject } from "ai";
import { extractText, getDocumentProxy } from "unpdf";
import { invoicePrompt } from "../../prompt";
import { invoiceSchema } from "../../schema";
import type { GetDocumentRequest } from "../../types";
import { getDomainFromEmail, removeProtocolFromDomain } from "../../utils";

export class InvoiceProcessor {
  async #processDocument({ documentUrl }: GetDocumentRequest) {
    if (!documentUrl) {
      throw new Error("Document URL is required");
    }

    try {
      const result = await generateObject({
        model: mistral("mistral-medium-latest"),
        schema: invoiceSchema,
        messages: [
          {
            role: "system",
            content: invoicePrompt,
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
    } catch {
      // Fallback to text extraction
      return this.#fallbackExtract(documentUrl);
    }
  }

  async #fallbackExtract(documentUrl: string) {
    if (!documentUrl) {
      throw new Error("Document URL is required");
    }

    const response = await fetch(documentUrl);
    const content = await response.arrayBuffer();
    const pdf = await getDocumentProxy(content);

    const { text } = await extractText(pdf, {
      mergePages: true,
    });

    // Unsupported Unicode escape sequence
    const cleanedText = text.replaceAll("\u0000", "");

    const result = await generateObject({
      model: mistral("mistral-medium-latest"),
      schema: invoiceSchema,
      messages: [
        {
          role: "system",
          content: invoicePrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: cleanedText,
            },
          ],
        },
      ],
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
      tax_amount: result.tax_amount,
      tax_rate: result.tax_rate,
      tax_type: result.tax_type,
      language: result.language,
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
