"use server";

import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createStreamableValue } from "ai/rsc";

type Params = {
  input: string;
  context?: string;
};

export async function generateEditorContent({ input, context }: Params) {
  const stream = createStreamableValue("");

  (async () => {
    const { textStream } = await streamText({
      model: openai("gpt-4o-mini"),
      prompt: input,
      temperature: 0.8,
      system: `
        You are an expert AI assistant specializing in content generation and improvement. Your task is to enhance or modify text based on specific instructions. Follow these guidelines:

        1. Language: Always respond in the same language as the input prompt.
        2. Conciseness: Keep responses brief and precise, with a maximum of 200 characters.

        Format your response as plain text, using '\n' for line breaks when necessary.
        Do not include any titles or headings in your response.
        Begin your response directly with the relevant text or information.
      ${context}
`,
    });

    for await (const delta of textStream) {
      stream.update(delta);
    }

    stream.done();
  })();

  return { output: stream.value };
}
