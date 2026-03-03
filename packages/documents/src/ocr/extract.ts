import { createInvoicePromptComponents } from "../prompts/factory";
import type { InvoiceData } from "../schema";
import {
  composeAnnotationPrompt,
  getMistralClient,
  invoiceJsonSchema,
  OCR_MODEL,
} from "./client";

export interface ExtractDocumentParams {
  documentUrl: string;
  mimetype: string;
  companyName?: string | null;
}

/**
 * Extract structured data from a single document using Mistral OCR API
 * with document_annotation. Handles both PDFs and images.
 *
 * Uses the same model and schema as the batch extraction path
 * (mistral-ocr-latest + invoiceSchema) for consistent results.
 */
export interface ExtractDocumentResult {
  data: Partial<InvoiceData>;
  content: string;
}

export async function extractDocument(
  params: ExtractDocumentParams,
): Promise<ExtractDocumentResult> {
  const client = getMistralClient();
  const promptComponents = createInvoicePromptComponents(params.companyName);
  const prompt = composeAnnotationPrompt(promptComponents);

  const isPdf =
    params.mimetype === "application/pdf" ||
    params.mimetype === "application/octet-stream";

  const document = isPdf
    ? { type: "document_url" as const, documentUrl: params.documentUrl }
    : { type: "image_url" as const, imageUrl: params.documentUrl };

  const response = await client.ocr.process({
    model: OCR_MODEL,
    document,
    documentAnnotationFormat: {
      type: "json_schema",
      jsonSchema: {
        name: "invoice_extraction",
        schemaDefinition: invoiceJsonSchema,
        strict: true,
      },
    },
    documentAnnotationPrompt: prompt,
    pages: [0, 1, 2, 3, 4, 5, 6, 7],
    includeImageBase64: false,
  });

  const annotation = response.documentAnnotation;
  if (!annotation) {
    throw new Error("No document annotation returned from OCR API");
  }

  const data: Partial<InvoiceData> =
    typeof annotation === "string" ? JSON.parse(annotation) : annotation;

  const content = (response.pages ?? [])
    .map((page) => page.markdown)
    .filter(Boolean)
    .join("\n");

  return { data, content };
}
