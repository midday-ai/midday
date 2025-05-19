"use server";

import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { createStreamableValue } from "ai/rsc";
import { z } from "zod";

const schema = z.object({
  name: z.string().optional().describe("The name to search for"),
  start: z
    .date()
    .optional()
    .describe("The start date when to retrieve from. Return ISO-8601 format."),
  end: z
    .date()
    .optional()
    .describe(
      "The end date when to retrieve data from. If not provided, defaults to the current date. Return ISO-8601 format.",
    ),
  status: z
    .enum(["in_progress", "completed"])
    .optional()
    .describe("The status to filter by"),
});

export async function generateTrackerFilters(prompt: string, context?: string) {
  const stream = createStreamableValue();

  (async () => {
    const { partialObjectStream } = await streamObject({
      model: openai("gpt-4o-mini"),
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
