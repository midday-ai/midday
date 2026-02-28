import { z } from "zod/v4";
import type { ClassificationData } from "../schema";
import { classificationSchema } from "../schema";
import { getMistralClient } from "./client";

const CLASSIFY_MODEL = "mistral-small-latest";

const classificationJsonSchema = z.toJSONSchema(classificationSchema, {
  target: "draft-07",
});

/**
 * Classify extracted text content using Mistral's completion API.
 * Used for non-PDF/image documents (CSV, DOCX, PPTX, etc.) where
 * Mistral OCR is not applicable.
 */
export async function classifyText(params: {
  content: string;
  fileName?: string;
}): Promise<ClassificationData> {
  const client = getMistralClient();

  const fileContext = params.fileName
    ? `\nOriginal filename: ${params.fileName}`
    : "";

  const truncated =
    params.content.length > 30000
      ? `${params.content.slice(0, 30000)}...[truncated]`
      : params.content;

  const result = await client.chat.complete({
    model: CLASSIFY_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a document classifier. Analyze the provided document text and extract classification metadata. Respond with valid JSON matching the schema.",
      },
      {
        role: "user",
        content: `Classify this document and extract metadata:${fileContext}\n\n---\n${truncated}`,
      },
    ],
    responseFormat: {
      type: "json_schema" as const,
      jsonSchema: {
        name: "classification",
        schemaDefinition: classificationJsonSchema,
        strict: true,
      },
    },
  });

  const content = result.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    return {
      title: null,
      summary: null,
      tags: null,
      date: null,
      language: null,
    };
  }

  try {
    return JSON.parse(content) as ClassificationData;
  } catch {
    return {
      title: null,
      summary: null,
      tags: null,
      date: null,
      language: null,
    };
  }
}
