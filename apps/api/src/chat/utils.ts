import { openai } from "@ai-sdk/openai";
import { generateText, Output, type UIMessageStreamWriter } from "ai";
import { z } from "zod";

type UIMessage = {
  role: string;
  parts?: { type: string; text?: string }[];
  content?: string;
};

function userMessageText(m: UIMessage): string {
  return Array.isArray(m.parts)
    ? m.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text ?? "")
        .join("")
    : typeof m.content === "string"
      ? m.content
      : "";
}

/**
 * Decode a `data:` URL into raw bytes + media type.
 * Returns `null` for non-data URLs.
 */
export function decodeDataUrl(
  url: URL,
): { data: Uint8Array; mediaType: string } | null {
  if (url.protocol !== "data:") return null;

  const href = url.href;
  const commaIdx = href.indexOf(",");
  const header = commaIdx === -1 ? href : href.slice(0, commaIdx);
  const body = commaIdx === -1 ? "" : href.slice(commaIdx + 1);
  const mediaType =
    header.match(/data:([^;]+)/)?.[1] ?? "application/octet-stream";

  return {
    data: Uint8Array.from(atob(body), (c) => c.charCodeAt(0)),
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

/**
 * Generate and stream a title on the first turn only.
 * Skips silently for follow-up turns or on failure.
 */
export async function writeChatTitle(
  writer: UIMessageStreamWriter,
  uiMessages: UIMessage[],
): Promise<void> {
  const userMessages = uiMessages.filter((m) => m.role === "user");
  if (userMessages.length !== 1) return;

  const text = userMessageText(userMessages[0]!);
  if (!text.trim()) return;

  try {
    const title = await generateChatTitle(text);

    if (title) {
      writer.write({
        type: "data-title",
        id: "chat-title",
        data: { title },
      });
    }
  } catch {
    // Title is non-critical — don't break the stream
  }
}
