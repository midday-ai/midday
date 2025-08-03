import { mistral } from "@ai-sdk/mistral";
import { generateObject } from "ai";
import { receiptPrompt } from "../../prompt";
import { receiptSchema } from "../../schema";
import type { GetDocumentRequest } from "../../types";
import { getDomainFromEmail, removeProtocolFromDomain } from "../../utils";
import { retryCall } from "../../utils/retry";

export class ReceiptProcessor {
  async #processDocument({ documentUrl }: GetDocumentRequest) {
    if (!documentUrl) {
      throw new Error("Document URL is required");
    }

    const result = await retryCall(() =>
      generateObject({
        model: mistral("mistral-medium-latest"),
        schema: receiptSchema,
        abortSignal: AbortSignal.timeout(20000), // 20s
        messages: [
          {
            role: "system",
            content: receiptPrompt,
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
      }),
    );

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
      type: "expense",
      date: result.date,
      amount: result.total_amount,
      currency: result.currency,
      name: result.store_name,
      tax_amount: result.tax_amount,
      tax_rate: result.tax_rate,
      tax_type: result.tax_type,
      language: result.language,
      metadata: {
        register_number: result.register_number ?? null,
        cashier_name: result.cashier_name ?? null,
        email: result.email ?? null,
      },
    };
  }
}
