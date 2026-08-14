import type SendblueAPI from "sendblue";

/** Credentials returned by a static configuration or a Vercel Connect provider. */
export interface SendblueCredentials {
  apiKey: string;
  apiSecret: string;
  defaultFromNumber: string;
}

/**
 * Resolves Sendblue credentials immediately before an outbound API request.
 *
 * Connect implementations should use this rather than materializing secrets
 * into environment variables. The adapter deliberately does not cache values
 * returned by this function, so short-lived Connect credentials can rotate.
 */
export type SendblueCredentialProvider = () =>
  | SendblueCredentials
  | Promise<SendblueCredentials>;

/** Verifies an inbound webhook before its body is parsed. */
export type SendblueWebhookVerifier = (
  request: Request,
  body: string,
) => boolean | Response | Promise<boolean | Response>;

export interface SendblueAdapterConfig extends Partial<SendblueCredentials> {
  /** Lazy credentials provider, for example one backed by Vercel Connect. */
  credentials?: SendblueCredentialProvider;
  webhookSecret?: string;
  /**
   * Header name Sendblue uses to deliver the webhook secret.
   * @default "sb-signing-secret"
   */
  webhookSecretHeader?: string;
  /**
   * Trusted webhook verifier. When set, it replaces shared-secret checking.
   * This is the intended hook for Connect trigger forwarding and OIDC.
   */
  webhookVerifier?: SendblueWebhookVerifier;
  statusCallbackUrl?: string;
  /**
   * Which messaging services to accept from inbound webhooks.
   * @default ["iMessage"]
   */
  allowedServices?: SendblueService[];
}

export type SendblueService = "iMessage" | "SMS" | "RCS" | "sms";

export interface SendblueThreadId {
  fromNumber: string;
  contactNumber?: string;
  groupId?: string;
}

// ---------------------------------------------------------------------------
// Inbound webhook payload shapes (not fully covered by the SDK's types)
// ---------------------------------------------------------------------------

export interface SendblueMessagePayload {
  accountEmail?: string;
  content: string;
  is_outbound: boolean;
  status: string;
  error_code: number | null;
  error_message: string | null;
  error_reason: string | null;
  error_detail: string | null;
  message_handle: string;
  date_sent: string;
  date_updated: string;
  from_number: string;
  number: string;
  to_number: string;
  was_downgraded: boolean | null;
  plan?: string;
  media_url: string;
  message_type: "message" | "group" | string;
  group_id: string;
  participants: string[];
  send_style: string;
  opted_out: boolean;
  sendblue_number: string | null;
  service: string;
  group_display_name: string | null;
}

export interface SendblueTypingPayload {
  number: string;
  is_typing: boolean;
  from_number: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Reactions (Sendblue tapbacks — not in the official SDK)
// ---------------------------------------------------------------------------

export type SendblueReaction =
  | "love"
  | "like"
  | "dislike"
  | "laugh"
  | "emphasize"
  | "question";

export const VALID_REACTIONS: ReadonlySet<string> = new Set<SendblueReaction>([
  "love",
  "like",
  "dislike",
  "laugh",
  "emphasize",
  "question",
]);

export const REACTION_ALIASES: Record<string, SendblueReaction> = {
  heart: "love",
  thumbs_up: "like",
  thumbsup: "like",
  "+1": "like",
  thumbs_down: "dislike",
  thumbsdown: "dislike",
  "-1": "dislike",
  haha: "laugh",
  exclamation: "emphasize",
  "!!": "emphasize",
  "?": "question",
};

// Re-export SDK types for convenience
export type { SendblueAPI };
export type MessageResponse = SendblueAPI.MessageResponse;
export type MessageListResponse = SendblueAPI.MessageListResponse;
export type MessageSendParams = SendblueAPI.MessageSendParams;
