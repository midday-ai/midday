import { Mistral } from "@mistralai/mistralai";
import { z } from "zod/v4";
import type { PromptComponents } from "../prompts/factory";
import { invoiceSchema } from "../schema";

export const OCR_MODEL = "mistral-ocr-latest";

export const invoiceJsonSchema = z.toJSONSchema(invoiceSchema, {
  target: "draft-07",
});

export function getMistralClient(): Mistral {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY environment variable is required");
  }
  return new Mistral({ apiKey });
}

export function composeAnnotationPrompt(components: PromptComponents): string {
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
