import { Mistral } from "@mistralai/mistralai";
import { z } from "zod/v4";
import { invoiceConfig } from "../config/extraction-config";
import type { PromptComponents } from "../prompts/factory";
import { invoiceSchema } from "../schema";

const OCR_MODEL = "mistral-ocr-latest";

const invoiceJsonSchema = z.toJSONSchema(invoiceSchema, {
  target: "draft-07",
});

function getMistralClient(): Mistral {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY environment variable is required");
  }
  return new Mistral({ apiKey });
}

function composeAnnotationPrompt(components: PromptComponents): string {
  const parts: string[] = [];
  parts.push(components.base);
  parts.push(
    "Extract structured data with maximum accuracy. Follow these instructions precisely:",
  );
  parts.push("");
  parts.push(components.examples);
  if (components.context) {
    parts.push("");
    parts.push(components.context);
  }
  parts.push("");
  parts.push(components.requirements);
  parts.push("");
  parts.push(components.fieldRules);
  parts.push("");
  parts.push(components.accuracyGuidelines);
  parts.push("");
  parts.push(components.commonErrors);
  parts.push("");
  parts.push(components.validation);
  return parts.join("\n");
}

export interface BatchExtractionItem {
  id: string;
  pdfBase64: string;
  companyName?: string | null;
}

export interface BatchExtractionResult {
  id: string;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

/**
 * Submit a batch of PDFs for extraction via Mistral Batch OCR API
 * with document annotations for structured data extraction.
 * Uses the dedicated OCR model for better accuracy on invoices/receipts.
 * Returns the batch job ID for polling.
 */
export async function submitBatchExtraction(
  items: BatchExtractionItem[],
): Promise<string> {
  const client = getMistralClient();
  const defaultPromptComponents = invoiceConfig.promptFactory();
  const defaultPrompt = composeAnnotationPrompt(defaultPromptComponents);

  const jsonlLines = items.map((item) => {
    const prompt = item.companyName
      ? composeAnnotationPrompt(invoiceConfig.promptFactory(item.companyName))
      : defaultPrompt;

    return JSON.stringify({
      custom_id: item.id,
      body: {
        document: {
          type: "document_url",
          document_url: `data:application/pdf;base64,${item.pdfBase64}`,
        },
        document_annotation_format: {
          type: "json_schema",
          json_schema: {
            name: "invoice_extraction",
            schema: invoiceJsonSchema,
            strict: true,
          },
        },
        document_annotation_prompt: prompt,
        pages: [0, 1, 2, 3, 4, 5, 6, 7],
        include_image_base64: false,
      },
    });
  });

  const jsonlContent = jsonlLines.join("\n");

  const file = await client.files.upload({
    file: {
      fileName: `batch-ocr-extract-${Date.now()}.jsonl`,
      content: new Blob([jsonlContent]),
    },
    purpose: "batch",
  });

  const job = await client.batch.jobs.create({
    inputFiles: [file.id],
    model: OCR_MODEL,
    endpoint: "/v1/ocr",
    metadata: { type: "inbox-extraction" },
    timeoutHours: 1,
  });

  return job.id;
}

export type BatchJobStatus =
  | "QUEUED"
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | "TIMEOUT_EXCEEDED"
  | "CANCELLATION_REQUESTED"
  | "CANCELLED";

export interface BatchJobInfo {
  status: BatchJobStatus;
  totalRequests: number;
  succeededRequests: number;
  failedRequests: number;
  outputFileId?: string | null;
  errorFileId?: string | null;
}

/**
 * Poll the status of a batch job.
 */
export async function getBatchJobStatus(jobId: string): Promise<BatchJobInfo> {
  const client = getMistralClient();
  const job = await client.batch.jobs.get({ jobId });

  return {
    status: job.status as BatchJobStatus,
    totalRequests: job.totalRequests ?? 0,
    succeededRequests: job.succeededRequests ?? 0,
    failedRequests: job.failedRequests ?? 0,
    outputFileId: job.outputFile,
    errorFileId: job.errorFile,
  };
}

/**
 * Download and parse batch OCR results into extraction results.
 * OCR batch responses have a different structure than chat completions:
 * the annotation is in response.body.document_annotation (JSON string).
 */
export async function downloadBatchResults(
  outputFileId: string,
): Promise<BatchExtractionResult[]> {
  const client = getMistralClient();
  const fileContent = await client.files.download({ fileId: outputFileId });

  // SDK returns ReadableStream<Uint8Array>
  const text = await new Response(fileContent).text();

  const lines = text.trim().split("\n").filter(Boolean);
  const results: BatchExtractionResult[] = [];

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      const customId = entry.custom_id;
      const response = entry.response;

      if (response?.status_code === 200 && response?.body) {
        const body = response.body;

        // OCR endpoint returns document_annotation as a JSON string
        const annotation = body.document_annotation;
        if (annotation) {
          const data =
            typeof annotation === "string"
              ? JSON.parse(annotation)
              : annotation;
          results.push({ id: customId, success: true, data });
        } else {
          // Fallback: check for chat completion format
          const content = body.choices?.[0]?.message?.content;
          if (content) {
            const data =
              typeof content === "string" ? JSON.parse(content) : content;
            results.push({ id: customId, success: true, data });
          } else {
            results.push({
              id: customId,
              success: false,
              error: "No annotation data in response",
            });
          }
        }
      } else {
        results.push({
          id: customId,
          success: false,
          error:
            response?.body?.error?.message ||
            `Status ${response?.status_code || "unknown"}`,
        });
      }
    } catch (parseError) {
      console.error("Failed to parse batch result line:", parseError);
    }
  }

  return results;
}

/**
 * Download and parse the error file from a batch job.
 * Returns IDs of requests that failed on Mistral's side so we can fall back.
 */
export async function downloadBatchErrors(
  errorFileId: string,
): Promise<BatchExtractionResult[]> {
  const client = getMistralClient();
  const fileContent = await client.files.download({ fileId: errorFileId });

  // SDK returns ReadableStream<Uint8Array>
  const text = await new Response(fileContent).text();

  const lines = text.trim().split("\n").filter(Boolean);
  const results: BatchExtractionResult[] = [];

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      results.push({
        id: entry.custom_id,
        success: false,
        error:
          entry.error?.message ||
          entry.response?.body?.error?.message ||
          `Status ${entry.response?.status_code || "unknown"}`,
      });
    } catch {
      // skip unparseable lines
    }
  }

  return results;
}

/**
 * Cancel a batch job.
 */
export async function cancelBatchJob(jobId: string): Promise<void> {
  const client = getMistralClient();
  await client.batch.jobs.cancel({ jobId });
}
