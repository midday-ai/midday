"use server";

import { openai } from "@ai-sdk/openai";
import { createStreamableValue } from "@ai-sdk/rsc";
import { streamObject } from "ai";
import { z } from "zod/v3";

const schema = z.object({
  name: z.string().optional().describe("The name to search for"),
  statuses: z
    .array(z.enum(["draft", "overdue", "paid", "unpaid", "canceled"]))
    .optional()
    .describe("The statuses to filter by"),
  start: z
    .string()
    .optional()
    .describe("The start date when to retrieve from. Return ISO-8601 format."),
  end: z
    .string()
    .optional()
    .describe(
      "The end date when to retrieve data from. If not provided, defaults to the current date. Return ISO-8601 format.",
    ),
  customers: z
    .array(z.string())
    .optional()
    .describe("The customers to filter by"),
});

export async function generateInvoiceFilters(prompt: string, context?: string) {
  const stream = createStreamableValue();

  (async () => {
    const { partialObjectStream } = await streamObject({
      model: openai("gpt-5-nano"),
      system: `You are a helpful assistant that generates filters for a given prompt. \n
                Current date is: ${new Date().toISOString().split("T")[0]} \n
                ${context}
        `,
      schema,
      prompt,
    });

    for await (const partialObject of partialObjectStream) {
      stream.update(partialObject);
    }

    stream.done();
  })();

  return { object: stream.value };
}
