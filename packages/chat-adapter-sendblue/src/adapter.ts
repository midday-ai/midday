import type {
  Adapter,
  AdapterPostableMessage,
  Attachment,
  ChatInstance,
  EmojiValue,
  FetchOptions,
  FetchResult,
  FormattedContent,
  Logger,
  RawMessage,
  StreamChunk,
  StreamOptions,
  ThreadInfo,
  WebhookOptions,
} from "chat";
import { ConsoleLogger, Message, parseMarkdown, stringifyMarkdown } from "chat";
import SendblueAPI from "sendblue";
import { toPlainText } from "./format-converter";
import type {
  SendblueAdapterConfig,
  SendblueMessagePayload,
  SendblueReaction,
  SendblueThreadId,
  SendblueTypingPayload,
} from "./types";
import { REACTION_ALIASES, VALID_REACTIONS } from "./types";

const DEFAULT_WEBHOOK_SECRET_HEADER = "sb-signing-secret";
const DEFAULT_ALLOWED_SERVICES = ["iMessage"];

export class SendblueAdapter
  implements Adapter<SendblueThreadId, SendblueMessagePayload>
{
  readonly name = "sendblue";
  readonly persistMessageHistory = true;
  readonly userName: string;

  private chat: ChatInstance | null = null;
  private logger: Logger;
  private config: SendblueAdapterConfig;
  private sdk: SendblueAPI;

  constructor(config: SendblueAdapterConfig & { logger?: Logger }) {
    this.config = config;
    this.userName = "midday";
    this.logger = config.logger ?? new ConsoleLogger();
    this.sdk = new SendblueAPI({
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
    });
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  async initialize(chat: ChatInstance): Promise<void> {
    this.chat = chat;
    this.logger = chat.getLogger("sendblue");
    this.logger.info("Sendblue adapter initialized");
  }

  async disconnect(): Promise<void> {
    this.logger.info("Sendblue adapter disconnected");
  }

  // ---------------------------------------------------------------------------
  // Thread ID encode / decode
  // ---------------------------------------------------------------------------

  encodeThreadId(data: SendblueThreadId): string {
    const from = Buffer.from(data.fromNumber).toString("base64url");
    if (data.groupId) {
      const group = Buffer.from(data.groupId).toString("base64url");
      return `sendblue:${from}:g:${group}`;
    }
    const contact = Buffer.from(data.contactNumber ?? "").toString("base64url");
    return `sendblue:${from}:${contact}`;
  }

  decodeThreadId(threadId: string): SendblueThreadId {
    const parts = threadId.split(":");
    if (parts.length < 3 || parts[0] !== "sendblue") {
      throw new Error(`Invalid Sendblue thread ID: ${threadId}`);
    }

    const fromNumber = Buffer.from(parts[1]!, "base64url").toString();

    if (parts[2] === "g" && parts[3]) {
      return {
        fromNumber,
        groupId: Buffer.from(parts[3], "base64url").toString(),
      };
    }

    return {
      fromNumber,
      contactNumber: Buffer.from(parts[2]!, "base64url").toString(),
    };
  }

  // ---------------------------------------------------------------------------
  // Webhook handling
  // ---------------------------------------------------------------------------

  async handleWebhook(
    request: Request,
    options?: WebhookOptions,
  ): Promise<Response> {
    if (this.config.webhookSecret) {
      const headerName =
        this.config.webhookSecretHeader ?? DEFAULT_WEBHOOK_SECRET_HEADER;
      const headerValue = request.headers.get(headerName);

      if (headerValue !== this.config.webhookSecret) {
        this.logger.warn("Sendblue webhook secret mismatch", {
          header: headerName,
        });
        return new Response("Unauthorized", { status: 401 });
      }
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return new Response("Bad Request", { status: 400 });
    }

    if ("is_typing" in body && typeof body.is_typing === "boolean") {
      this.handleTypingWebhook(body as unknown as SendblueTypingPayload);
      return new Response("OK", { status: 200 });
    }

    if ("message_handle" in body && typeof body.message_handle === "string") {
      const payload = body as unknown as SendblueMessagePayload;

      this.logger.info("Sendblue webhook message received", {
        is_outbound: payload.is_outbound,
        status: payload.status,
        hasContent: !!payload.content,
        hasMediaUrl: !!payload.media_url,
        mediaUrlPrefix: payload.media_url?.slice(0, 50),
        service: payload.service,
      });

      if (!this.isServiceAllowed(payload.service)) {
        this.logger.debug("Sendblue webhook filtered by service", {
          service: payload.service,
        });

        return new Response("OK", { status: 200 });
      }

      if (!payload.is_outbound && payload.status === "RECEIVED") {
        await this.processInboundMessage(payload, options);
      }

      return new Response("OK", { status: 200 });
    }

    this.logger.debug("Sendblue webhook ignored (unrecognized type)", {
      keys: Object.keys(body),
    });

    return new Response("OK", { status: 200 });
  }

  private async processInboundMessage(
    payload: SendblueMessagePayload,
    options?: WebhookOptions,
  ): Promise<void> {
    if (!this.chat) return;

    const threadId = this.threadIdFromPayload(payload);

    this.markRead(threadId).catch(() => {});

    const factory = async (): Promise<Message<SendblueMessagePayload>> => {
      return this.parseMessage(payload);
    };

    this.chat.processMessage(this, threadId, factory, options);
  }

  private handleTypingWebhook(payload: SendblueTypingPayload): void {
    this.logger.debug("Sendblue typing indicator", {
      number: payload.number,
      isTyping: payload.is_typing,
    });
  }

  // ---------------------------------------------------------------------------
  // Message parsing
  // ---------------------------------------------------------------------------

  parseMessage(raw: SendblueMessagePayload): Message<SendblueMessagePayload> {
    const threadId = this.threadIdFromPayload(raw);
    const text = raw.content ?? "";

    const attachments: Attachment[] = [];

    if (raw.media_url && raw.media_url.length > 0) {
      attachments.push(this.buildAttachment(raw.media_url));
    }

    return new Message({
      id: raw.message_handle,
      threadId,
      text,
      formatted: parseMarkdown(text),
      raw,
      author: {
        userId: raw.is_outbound ? (raw.from_number ?? "bot") : raw.from_number,
        userName: raw.is_outbound
          ? (raw.from_number ?? "bot")
          : raw.from_number,
        fullName: "",
        isBot: raw.is_outbound,
        isMe: raw.is_outbound,
      },
      metadata: {
        dateSent: new Date(raw.date_sent),
        edited: false,
      },
      isMention: !raw.is_outbound,
      attachments,
    });
  }

  // ---------------------------------------------------------------------------
  // Sending messages
  // ---------------------------------------------------------------------------

  async postMessage(
    threadId: string,
    message: AdapterPostableMessage,
  ): Promise<RawMessage<SendblueMessagePayload>> {
    const decoded = this.decodeThreadId(threadId);
    const text = this.renderOutbound(message);

    if (!text?.trim()) {
      this.logger.debug("Skipping empty outbound message");
      return {
        raw: {} as SendblueMessagePayload,
        id: "",
        threadId,
      };
    }

    let response: SendblueAPI.MessageResponse;

    if (decoded.groupId) {
      response = await this.sdk.groups.sendMessage({
        from_number: decoded.fromNumber,
        content: text,
        group_id: decoded.groupId,
      });
    } else {
      response = await this.sdk.messages.send({
        number: decoded.contactNumber!,
        from_number: decoded.fromNumber,
        content: text,
        media_url: undefined,
        status_callback: this.config.statusCallbackUrl,
      });
    }

    return {
      raw: response as unknown as SendblueMessagePayload,
      id: response.message_handle ?? "",
      threadId,
    };
  }

  async sendMediaMessage(
    threadId: string,
    mediaUrl: string,
    content?: string,
  ): Promise<void> {
    const decoded = this.decodeThreadId(threadId);
    if (decoded.groupId) return;

    await this.sdk.messages.send({
      number: decoded.contactNumber!,
      from_number: decoded.fromNumber,
      content: content ?? "",
      media_url: mediaUrl,
      status_callback: this.config.statusCallbackUrl,
    });
  }

  async stream(
    threadId: string,
    textStream: AsyncIterable<string | StreamChunk>,
    _options?: StreamOptions,
  ): Promise<RawMessage<SendblueMessagePayload>> {
    let lastResult: RawMessage<SendblueMessagePayload> | undefined;
    let current = "";

    for await (const chunk of textStream) {
      let text = "";
      if (typeof chunk === "string") {
        text = chunk;
      } else if (chunk.type === "markdown_text") {
        text = chunk.text;
      }
      if (!text) continue;

      current += text;

      const parts = current.split("\n\n");
      if (parts.length > 1) {
        for (let i = 0; i < parts.length - 1; i++) {
          const seg = parts[i]!.trim();
          if (seg) {
            lastResult = await this.postMessage(threadId, { markdown: seg });
          }
        }
        current = parts[parts.length - 1]!;
      }
    }

    if (current.trim()) {
      lastResult = await this.postMessage(threadId, {
        markdown: current.trim(),
      });
    }

    if (!lastResult) {
      this.logger.debug("Stream produced no content, skipping send");
      return { raw: {} as SendblueMessagePayload, id: "", threadId };
    }

    return lastResult;
  }

  async editMessage(
    _threadId: string,
    _messageId: string,
    _message: AdapterPostableMessage,
  ): Promise<RawMessage<SendblueMessagePayload>> {
    throw new Error(
      "Sendblue does not support message editing. iMessage messages cannot be edited via API.",
    );
  }

  async deleteMessage(_threadId: string, _messageId: string): Promise<void> {
    this.logger.warn(
      "Sendblue deleteMessage is a soft-delete only — it does not unsend on the recipient's device",
    );
  }

  // ---------------------------------------------------------------------------
  // Reactions (not in official SDK — use raw HTTP)
  // ---------------------------------------------------------------------------

  async addReaction(
    threadId: string,
    messageId: string,
    emoji: EmojiValue | string,
  ): Promise<void> {
    const decoded = this.decodeThreadId(threadId);
    const emojiName = typeof emoji === "string" ? emoji : emoji.name;
    const reaction = this.resolveReaction(emojiName);

    if (!reaction) {
      this.logger.warn("Unsupported Sendblue reaction, ignoring", {
        emoji: emojiName,
      });
      return;
    }

    await this.sdk.post("/api/send-reaction", {
      body: {
        from_number: decoded.fromNumber,
        message_handle: messageId,
        reaction,
      },
    });
  }

  async removeReaction(
    _threadId: string,
    _messageId: string,
    _emoji: EmojiValue | string,
  ): Promise<void> {
    this.logger.debug("Sendblue does not support removing reactions via API");
  }

  // ---------------------------------------------------------------------------
  // Fetching
  // ---------------------------------------------------------------------------

  async fetchMessages(
    threadId: string,
    options?: FetchOptions,
  ): Promise<FetchResult<SendblueMessagePayload>> {
    const decoded = this.decodeThreadId(threadId);
    const limit = options?.limit ?? 20;
    const offset =
      options?.cursor != null ? Number.parseInt(options.cursor, 10) : 0;

    const result = await this.sdk.messages.list({
      limit,
      offset,
      order_by: "sentAt",
      order_direction: "desc",
      number: decoded.contactNumber,
      sendblue_number: decoded.fromNumber,
      group_id: decoded.groupId,
      message_type: decoded.groupId ? "group" : "message",
    });

    const messages = (result.data ?? [])
      .map((raw) => this.parseMessage(raw as unknown as SendblueMessagePayload))
      .reverse();

    const total = result.pagination?.total ?? 0;
    const nextOffset = offset + limit;
    const nextCursor = nextOffset < total ? String(nextOffset) : undefined;

    return { messages, nextCursor };
  }

  async fetchThread(threadId: string): Promise<ThreadInfo> {
    const decoded = this.decodeThreadId(threadId);
    return {
      id: threadId,
      channelId: this.channelIdFromThreadId(threadId),
      isDM: !decoded.groupId,
      metadata: {
        fromNumber: decoded.fromNumber,
        contactNumber: decoded.contactNumber,
        groupId: decoded.groupId,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Typing
  // ---------------------------------------------------------------------------

  async startTyping(threadId: string): Promise<void> {
    const decoded = this.decodeThreadId(threadId);

    if (!decoded.contactNumber) {
      this.logger.debug(
        "Sendblue typing indicators not supported for group threads",
      );
      return;
    }

    try {
      await this.sdk.typingIndicators.send({
        number: decoded.contactNumber,
        from_number: decoded.fromNumber,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("No route mapping")) {
        this.logger.debug(
          "Sendblue typing indicator skipped: no route mapping",
          { number: decoded.contactNumber },
        );
        return;
      }
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Sendblue-specific helpers (not part of Adapter interface)
  // ---------------------------------------------------------------------------

  async markRead(threadId: string): Promise<void> {
    const decoded = this.decodeThreadId(threadId);
    if (!decoded.contactNumber) return;

    await this.sdk.post("/api/mark-read", {
      body: {
        number: decoded.contactNumber,
        from_number: decoded.fromNumber,
      },
    });
  }

  async evaluateService(
    number: string,
  ): Promise<{ number?: string; service?: "iMessage" | "SMS" }> {
    return this.sdk.lookups.lookupNumber({ number });
  }

  async listLines(): Promise<unknown> {
    return this.sdk.get("/api/lines");
  }

  /** Direct access to the official Sendblue SDK client */
  getSdk(): SendblueAPI {
    return this.sdk;
  }

  // ---------------------------------------------------------------------------
  // Channel ID
  // ---------------------------------------------------------------------------

  channelIdFromThreadId(threadId: string): string {
    const parts = threadId.split(":");
    return `${parts[0]}:${parts[1]}`;
  }

  // ---------------------------------------------------------------------------
  // Formatting
  // ---------------------------------------------------------------------------

  renderFormatted(content: FormattedContent): string {
    return toPlainText(stringifyMarkdown(content));
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private renderOutbound(message: AdapterPostableMessage): string {
    if (typeof message === "string") return toPlainText(message);
    if ("markdown" in message && typeof message.markdown === "string") {
      return toPlainText(message.markdown);
    }
    if ("text" in message && typeof message.text === "string") {
      return toPlainText(message.text);
    }
    if ("ast" in message && message.ast) {
      return toPlainText(stringifyMarkdown(message.ast));
    }
    return "";
  }

  private threadIdFromPayload(payload: SendblueMessagePayload): string {
    const fromNumber =
      payload.sendblue_number ??
      (payload.is_outbound ? payload.from_number : payload.to_number);

    if (payload.group_id && payload.group_id.length > 0) {
      return this.encodeThreadId({ fromNumber, groupId: payload.group_id });
    }

    const contactNumber = payload.is_outbound
      ? payload.to_number
      : payload.from_number;

    return this.encodeThreadId({ fromNumber, contactNumber });
  }

  private isServiceAllowed(service: string): boolean {
    const allowed = this.config.allowedServices ?? DEFAULT_ALLOWED_SERVICES;
    return allowed.some((s) => s.toLowerCase() === service.toLowerCase());
  }

  private resolveReaction(name: string): SendblueReaction | null {
    const lower = name.toLowerCase();
    if (VALID_REACTIONS.has(lower)) return lower as SendblueReaction;
    return REACTION_ALIASES[lower] ?? null;
  }

  private buildAttachment(mediaUrl: string): Attachment {
    const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "heic", "webp"]);

    if (mediaUrl.startsWith("data:")) {
      const commaIdx = mediaUrl.indexOf(",");
      if (commaIdx !== -1) {
        const header = mediaUrl.slice(5, commaIdx);
        const mime =
          header.replace(";base64", "") || "application/octet-stream";
        const ext = mime.split("/")[1] ?? "bin";
        const decoded = Buffer.from(mediaUrl.slice(commaIdx + 1), "base64");
        return {
          type: mime.startsWith("image/") ? "image" : "file",
          name: `attachment.${ext}`,
          mimeType: mime,
          data: decoded,
          fetchData: async () => decoded,
        };
      }
    }

    const ext = mediaUrl.split(".").pop()?.toLowerCase() ?? "";
    const isImage = IMAGE_EXTS.has(ext);
    return {
      type: isImage ? "image" : "file",
      name: mediaUrl.split("/").pop() ?? "attachment",
      mimeType: isImage
        ? `image/${ext === "jpg" ? "jpeg" : ext}`
        : "application/octet-stream",
      url: mediaUrl,
      fetchData: async () => {
        const res = await fetch(mediaUrl);
        return Buffer.from(await res.arrayBuffer());
      },
    };
  }
}
