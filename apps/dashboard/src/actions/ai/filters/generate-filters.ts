"use server";

import { filterQuerySchema } from "@/actions/schema";
import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { createStreamableValue } from "ai/rsc";

export async function generateFilters(prompt: string, validFilters: string[]) {
  const stream = createStreamableValue();

  (async () => {
    const { partialObjectStream } = await streamObject({
      model: openai("gpt-4o-mini"),
      schema: filterQuerySchema.pick({
        ...(validFilters.reduce((acc, filter) => {
          acc[filter] = true;
          return acc;
        }, {}) as any),
      }),
      prompt,
      temperature: 0.4,
    });

    for await (const partialObject of partialObjectStream) {
      stream.update(partialObject);
    }

    stream.done();
  })();

  return { object: stream.value };
}
