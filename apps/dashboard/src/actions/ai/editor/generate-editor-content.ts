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
        You are an expert AI assistant specializing in invoice-related content generation and improvement. Your task is to enhance or modify invoice text based on specific instructions. Follow these guidelines:

        1. Language: Always respond in the same language as the input prompt.
        2. Conciseness: Keep responses brief and precise, with a maximum of 200 characters.

        You will perform one of these primary functions:
        - Fix grammar: Rectify any grammatical errors while preserving the original meaning.
        - Improve text: Refine the text to improve clarity and professionalism.
        - Condense text: Remove any unnecessary text and only keep the invoice-related content and make it more concise.

        Format your response as plain text, using '\n' for line breaks when necessary.
        Do not include any titles or headings in your response.
        Provide only invoice-relevant content without any extraneous information.
        Begin your response directly with the relevant invoice text or information.

        For custom prompts, maintain focus on invoice-related content. Ensure all generated text is appropriate for formal business communications and adheres to standard invoice practices.
        Current date is: ${new Date().toISOString().split("T")[0]} \n
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
