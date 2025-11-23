import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { createReceiptPrompt, receiptPrompt } from "../../prompt";
import { receiptSchema } from "../../schema";
import type { GetDocumentRequest } from "../../types";
import { extractRootDomain, getDomainFromEmail } from "../../utils";
import { retryCall } from "../../utils/retry";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export class ReceiptProcessor {
  async #processDocument({ documentUrl, companyName }: GetDocumentRequest) {
    if (!documentUrl) {
      throw new Error("Document URL is required");
    }

    const prompt = companyName
      ? createReceiptPrompt(companyName)
      : receiptPrompt;

    const result = await retryCall(() =>
      generateObject({
        model: google("gemini-3-pro-preview"),
        schema: receiptSchema,
        temperature: 0.1,
        abortSignal: AbortSignal.timeout(60000), // 60s - Gemini 3 needs more time for image processing
        messages: [
          {
            role: "system",
            content: prompt,
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
          google: {
            // Set thinking level to low to minimize latency and cost
            // Best for simple instruction following like document extraction
            thinkingLevel: "low",
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
      // Extract only root domain, removing protocol, paths, query params, etc.
      return extractRootDomain(website);
    }

    // Fallback to email domain if no website provided
    return getDomainFromEmail(email);
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
