import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const schema = z.object({
  name: z.string().describe("The supplier or company of the invoice."),
  amount: z
    .number()
    .describe("The total amount of the invoice, usually the highest amount."),
  date: z
    .string()
    .describe("The due date of the invoice (ISO 8601 date string)."),
  website: z
    .string()
    .describe(
      "Website of the supplier or company without protocol (e.g. example.com).",
    ),
  currency: z.string().describe("Currency code of the invoice."),
});

export class LlmProcessor {
  public async getStructuredData(content: string) {
    try {
      const { object } = await generateObject({
        model: openai("gpt-4o-mini"),
        mode: "json",
        schema,
        prompt: content,
      });

      return {
        name: object.name,
        amount: object.amount,
        date: object.date,
        website: object.website?.replace(/^https?:\/\//, ""),
        currency: object.currency,
      };
    } catch (error) {
      return null;
    }
  }
}
