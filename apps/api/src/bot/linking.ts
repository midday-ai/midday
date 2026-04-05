import type { Message } from "chat";

type SupportedLinkPlatform = "slack" | "telegram" | "whatsapp" | "sendblue";

const PLATFORM_LINK_CODE_PATTERN = /^[A-Za-z0-9_-]{8}$/;

export function getMessageAuthorId(message: Message) {
  const userId = message.author?.userId;
  return userId ? String(userId) : "";
}

export function extractConnectionToken(
  platform: SupportedLinkPlatform,
  text: string | undefined,
) {
  const value = text?.trim();

  if (!value) {
    return null;
  }

  if (platform === "telegram") {
    const match = value.match(/^\/start(?:@\w+)?\s+(.+)$/i);
    const token = match?.[1]?.trim();
    return token && PLATFORM_LINK_CODE_PATTERN.test(token) ? token : null;
  }

  const parts = value.split(/[:\s]+/).filter(Boolean);
  const candidate = parts[parts.length - 1];

  return candidate && PLATFORM_LINK_CODE_PATTERN.test(candidate)
    ? candidate
    : null;
}
