import type { Message } from "chat";

type SupportedLinkPlatform = "slack" | "telegram" | "whatsapp" | "sendblue";

const LINK_CODE_CHARS = /^[A-Za-z0-9]{8}$/;
const MIXED_ALPHANUMERIC = /^(?=.*[0-9])(?=.*[A-Za-z])[A-Za-z0-9]{8}$/;
const CONNECT_PREFIX = /^connect\s+to\s+midday\s*:\s*/i;

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
    return token && LINK_CODE_CHARS.test(token) ? token : null;
  }

  const prefixMatch = value.match(CONNECT_PREFIX);
  if (prefixMatch) {
    const candidate = value.slice(prefixMatch[0].length).trim();
    return LINK_CODE_CHARS.test(candidate) ? candidate : null;
  }

  return MIXED_ALPHANUMERIC.test(value) ? value : null;
}

export function isExplicitConnectionAttempt(
  platform: SupportedLinkPlatform,
  text: string | undefined,
): boolean {
  const value = text?.trim();
  if (!value) return false;
  if (platform === "telegram") {
    return /^\/start(?:@\w+)?\s+/i.test(value);
  }
  return CONNECT_PREFIX.test(value);
}
