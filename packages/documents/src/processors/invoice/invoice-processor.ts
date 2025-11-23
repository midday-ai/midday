import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import { extractText, getDocumentProxy } from "unpdf";
import type { z } from "zod/v4";
import { createInvoicePrompt, invoicePrompt } from "../../prompt";
import { invoiceSchema } from "../../schema";
import type { GetDocumentRequest } from "../../types";
import { extractRootDomain, getDomainFromEmail } from "../../utils";
import { retryCall } from "../../utils/retry";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export class InvoiceProcessor {
  // Check if the extracted data meets minimum quality standards
  #isDataQualityPoor(result: z.infer<typeof invoiceSchema>): boolean {
    const criticalFieldsMissing =
      !result.total_amount ||
      !result.currency ||
      !result.vendor_name ||
      (!result.invoice_date && !result.due_date);

    return criticalFieldsMissing;
  }

  async #processDocument({ documentUrl, companyName }: GetDocumentRequest) {
    if (!documentUrl) {
      throw new Error("Document URL is required");
    }

    try {
      const prompt = companyName
        ? createInvoicePrompt(companyName)
        : invoicePrompt;

      // Convert HTTP URL to base64 data URL (Gemini requires base64 inlineData)
      let fileData = documentUrl;
      if (documentUrl.startsWith("http")) {
        const response = await fetch(documentUrl);
        const arrayBuffer = await response.arrayBuffer();
        const base64Content = Buffer.from(arrayBuffer).toString("base64");
        fileData = `data:application/pdf;base64,${base64Content}`;
      }

      const result = await retryCall(() =>
        generateObject({
          model: google("gemini-3-pro-preview"),
          schema: invoiceSchema,
          temperature: 1,
          abortSignal: AbortSignal.timeout(60000), // 60s - Gemini 3 needs more time for PDF processing
          messages: [
            {
              role: "system",
              content: prompt,
            },
            {
              role: "user",
              content: [
                {
                  type: "file",
                  data: fileData,
                  mediaType: "application/pdf",
                },
              ],
            },
          ],
          providerOptions: {
            google: {
              // Set media resolution to medium for PDFs (recommended by Gemini 3 docs)
              // medium (560 tokens) is optimal for document understanding
              // See: https://ai.google.dev/gemini-api/docs/gemini-3?thinking=high#media-resolution
              mediaResolution: "MEDIA_RESOLUTION_MEDIUM",
              // Set thinking level to low to minimize latency and cost
              // Best for simple instruction following like document extraction
              // See: https://ai.google.dev/gemini-api/docs/gemini-3?thinking=high#thinking-level
              thinkingLevel: "low",
            },
          },
        }),
      );

      console.log("result:", result.object);

      // Check data quality and merge with fallback if poor
      if (this.#isDataQualityPoor(result.object)) {
        console.log(
          "Primary processing completed but data quality is poor, running OCR + LLM fallback",
        );

        try {
          const fallbackResult = await this.#fallbackExtract(documentUrl);

          const mergedResult = {
            ...result.object,
            total_amount:
              result.object.total_amount || fallbackResult.total_amount,
            currency: result.object.currency || fallbackResult.currency,
            vendor_name:
              result.object.vendor_name || fallbackResult.vendor_name,
            invoice_date:
              result.object.invoice_date || fallbackResult.invoice_date,
            due_date: result.object.due_date || fallbackResult.due_date,
            // Fill in other fields from fallback if missing
            invoice_number:
              result.object.invoice_number || fallbackResult.invoice_number,
            customer_name:
              result.object.customer_name || fallbackResult.customer_name,
            vendor_address:
              result.object.vendor_address || fallbackResult.vendor_address,
            customer_address:
              result.object.customer_address || fallbackResult.customer_address,
            email: result.object.email || fallbackResult.email,
            website: result.object.website || fallbackResult.website,
            tax_amount: result.object.tax_amount || fallbackResult.tax_amount,
            tax_rate: result.object.tax_rate || fallbackResult.tax_rate,
            tax_type: result.object.tax_type || fallbackResult.tax_type,
            payment_instructions:
              result.object.payment_instructions ||
              fallbackResult.payment_instructions,
            notes: result.object.notes || fallbackResult.notes,
            language: result.object.language || fallbackResult.language,
            line_items:
              result.object.line_items?.length > 0
                ? result.object.line_items
                : fallbackResult.line_items,
          };

          return mergedResult;
        } catch (fallbackError) {
          console.log("OCR + LLM fallback also failed:", fallbackError);
          return result.object; // Return original result if fallback fails
        }
      }

      return result.object;
    } catch (error) {
      console.log(
        "Primary processing failed, falling back to OCR + LLM:",
        error,
      );
      // Fallback to OCR + LLM
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

    const result = await retryCall(() =>
      generateObject({
        model: google("gemini-3-pro-preview"),
        schema: invoiceSchema,
        abortSignal: AbortSignal.timeout(60000), // 60s - Gemini 3 needs more time
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
        providerOptions: {
          google: {
            // Set thinking level to low to minimize latency and cost
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
      date: result.due_date ?? result.invoice_date,
      amount: result.total_amount,
      currency: result.currency,
      name: result.vendor_name,
      tax_amount: result.tax_amount,
      tax_rate: result.tax_rate,
      tax_type: result.tax_type,
      language: result.language,
      metadata: {
        invoice_date: result.invoice_date ?? null,
        payment_instructions: result.payment_instructions ?? null,
        invoice_number: result.invoice_number ?? null,
        customer_name: result.customer_name ?? null,
        customer_address: result.customer_address ?? null,
        vendor_address: result.vendor_address ?? null,
        vendor_name: result.vendor_name ?? null,
        email: result.email ?? null,
      },
    };
  }
}
