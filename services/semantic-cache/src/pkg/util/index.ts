import type { Context } from "@/pkg/hono/app";
import { sha256 } from "@internal/hash";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export async function createCompletionChunk(content: string, stop = false) {
  return {
    id: `chatcmpl-${await sha256(content)}-${stop}`,
    object: "chat.completion.chunk",
    created: new Date().toISOString(),
    model: "gpt-4",
    choices: [
      {
        delta: {
          content,
        },
        index: 0,
        finish_reason: stop ? "stop" : null,
      },
    ],
  };
}

export function OpenAIResponse(content: string) {
  return {
    choices: [
      {
        message: {
          content,
        },
      },
    ],
  };
}

/**
 * Extracts the word enclosed in double quotes from the given chunk.
 *
 * @example
 * ```ts
 * const chunk = 'This is a "sample" chunk of text.';
 * const word = extractWord(chunk);
 * console.log(word); // Output: sample
 * ```
 *
 * @param chunk - The chunk of text to extract the word from.
 * @returns The extracted word, or an empty string if no word is found.
 */
export function extractWord(chunk: string): string {
  const match = chunk.match(/"((?:\\"|[^"])*)"/);
  return match?.[1]?.replace(/\\"/g, '"') ?? "";
}

export function parseMessagesToString(
  messages: Array<ChatCompletionMessageParam>
) {
  return (messages.at(-1)?.content || "") as string;
}

export async function getEmbeddings(
  c: Context,
  messages: string
): Promise<number[]> {
  const embeddings = await c.env.AI.run("@cf/baai/bge-small-en-v1.5", {
    text: messages,
  });

  return embeddings.data[0]!;
}
