import { mistral } from "@ai-sdk/mistral";
import { generateObject } from "ai";
import { z } from "zod";
import type { DocumentClassifierRequest } from "../types";

export class DocumentClassifier {
  async #processDocument({ content }: DocumentClassifierRequest) {
    const result = await generateObject({
      model: mistral("mistral-small-latest"),
      schema: z.object({
        title: z.string().nullable().describe("The title of the document."),
        summary: z
          .string()
          .nullable()
          .describe(
            "A brief, one-sentence summary of the document's main purpose or content.",
          ),
        tags: z
          .array(z.string())
          .max(5)
          .nullable()
          .describe(
            "Up to 5 relevant keywords or phrases for classifying and searching the document (e.g., 'Invoice', 'Acme Corp Contract', 'Marketing Report'). Prioritize document type, key names, and subject.",
          ),
        date: z
          .string()
          .nullable()
          .describe(
            "The single most relevant date found in the document (e.g., issue date, signing date) in ISO 8601 format (YYYY-MM-DD)",
          ),
      }),
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You are an expert multilingual document analyzer. Your task is to read the provided business document text (which could be an Invoice, Receipt, Contract, Agreement, Report, etc.) and generate:
1.  **A Concise Summary:** A single sentence capturing the essence of the document (e.g., "Invoice from Supplier X for services rendered in May 2024", "Employment agreement between Company Y and John Doe", "Quarterly financial report for Q1 2024").
2.  **The Most Relevant Date (\`date\`):** Identify the single most important date mentioned (e.g., issue date, signing date, effective date). Format it strictly as YYYY-MM-DD. If multiple dates exist, choose the primary one representing the document's core event. If no clear date is found, return null for this field.
3.  **Relevant Tags (Up to 5):** Generate up to 5 highly relevant and distinct tags to help classify and find this document later. When creating these tags, **strongly prioritize including:**
    *   The inferred **document type** (e.g., "Invoice", "Contract", "Receipt", "Report").
    *   Key **company or individual names** explicitly mentioned.
    *   The core **subject** or 1-2 defining keywords from the summary or document content.
    *   If the document represents a purchase (like an invoice or receipt), include a tag for the **single most significant item or service** purchased (e.g., "Software License", "Consulting Services", "Office Desk").

    Make the tags concise and informative. Aim for tags that uniquely identify the document's key characteristics for searching. Avoid overly generic terms (like "document", "file", "text") or date-related tags (as the date is extracted separately). Base tags strictly on the content provided.`,
        },
        {
          role: "user",
          content,
        },
      ],
    });

    return result.object;
  }

  public async classifyDocument(request: DocumentClassifierRequest) {
    const result = await this.#processDocument(request);

    return result;
  }
}
