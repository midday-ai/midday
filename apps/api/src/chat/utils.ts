import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";

/**
 * Extract the text of the last user message from a UI message array.
 * Handles both the `parts`-based and legacy `content`-string formats.
 */
export function extractLastUserText(
  uiMessages: {
    role: string;
    parts?: { type: string; text?: string }[];
    content?: string;
  }[],
): string | undefined {
  return uiMessages
    .filter((m) => m.role === "user")
    .map((m) =>
      Array.isArray(m.parts)
        ? m.parts
            .filter((p) => p.type === "text")
            .map((p) => p.text ?? "")
            .join("")
        : typeof m.content === "string"
          ? m.content
          : "",
    )
    .at(-1);
}

/**
 * Decode a `data:` URL into raw bytes + media type.
 * Returns `null` for non-data URLs.
 */
export function decodeDataUrl(
  url: URL,
): { data: Uint8Array; mediaType: string } | null {
  if (url.protocol !== "data:") return null;

  const [header, base64] = url.href.split(",");
  const mediaType =
    header?.match(/data:([^;]+)/)?.[1] ?? "application/octet-stream";

  return {
    data: Uint8Array.from(atob(base64 ?? ""), (c) => c.charCodeAt(0)),
    mediaType,
  };
}

const titleSchema = z.object({
  title: z.string().describe("Concise 3-5 word conversation title"),
});

/**
 * Generate a short title for a chat conversation from the user's message.
 * Returns `null` if generation fails or the input is empty.
 */
export async function generateChatTitle(
  userText: string,
): Promise<string | null> {
  const trimmed = userText.trim();
  if (!trimmed) return null;

  const { output: result } = await generateText({
    model: openai("gpt-4o-mini"),
    output: Output.object({ schema: titleSchema }),
    prompt: `Generate a concise 3-5 word title for this conversation.\n\nUser: ${trimmed}`,
  });

  return result?.title ?? null;
}
