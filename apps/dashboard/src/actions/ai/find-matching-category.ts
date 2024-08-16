"use server";

import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { createStreamableValue } from "ai/rsc";
import { z } from "zod";

export async function findMatchingCategory(
  prompt: string,
  categories: string[],
) {
  const stream = createStreamableValue();

  (async () => {
    const { partialObjectStream } = await streamObject({
      model: openai("gpt-4o-mini"),
      system: `You are an AI assistant specialized in categorizing financial transactions.
               Your task is to analyze the given transaction description and match it to the most appropriate category from the provided list.
               Only use categories from the list provided. If no category seems to fit, respond with 'Uncategorized'.
               Consider common financial terms, merchant names, and transaction patterns in your analysis.
               Categories: ${categories.join("\n")}
      `,
      schema: z.object({
        category: z
          .string()
          .describe("The category name that matches the prompt"),
      }),
      prompt,
      temperature: 0.5,
    });

    for await (const partialObject of partialObjectStream) {
      stream.update(partialObject);
    }

    stream.done();
  })();

  return { object: stream.value };
}
