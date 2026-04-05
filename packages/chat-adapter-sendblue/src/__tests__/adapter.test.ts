import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { SendblueMessagePayload } from "../types";

const sendMock = mock(() =>
  Promise.resolve({ message_handle: "msg_123", status: "QUEUED" }),
);
const groupSendMock = mock(() =>
  Promise.resolve({ message_handle: "grp_123", status: "QUEUED" }),
);
const postMock = mock(() => Promise.resolve({}));
const listMock = mock(() => Promise.resolve({ data: [] }));

mock.module("sendblue", () => ({
  default: class FakeSendblue {
    messages = { send: sendMock, list: listMock };
    groups = { sendMessage: groupSendMock };
    lookups = { lookupNumber: mock(() => Promise.resolve({})) };
    post = postMock;
    get = mock(() => Promise.resolve({}));
  },
}));

const { SendblueAdapter } = await import("../adapter");

function createAdapter(overrides: Record<string, unknown> = {}) {
  return new SendblueAdapter({
    apiKey: "test-key",
    apiSecret: "test-secret",
    defaultFromNumber: "+13137386158",
    webhookSecret: "test-webhook-secret",
    ...overrides,
  });
}

function makePayload(
  overrides: Partial<SendblueMessagePayload> = {},
): SendblueMessagePayload {
  return {
    content: "Hello from iMessage",
    is_outbound: false,
    status: "RECEIVED",
    error_code: null,
    error_message: null,
    error_reason: null,
    error_detail: null,
    message_handle: "msg_abc",
    date_sent: "2026-04-04T10:00:00Z",
    date_updated: "2026-04-04T10:00:00Z",
    from_number: "+14155551234",
    number: "+13137386158",
    to_number: "+13137386158",
    was_downgraded: null,
    media_url: "",
    message_type: "message",
    group_id: "",
    participants: [],
    send_style: "",
    opted_out: false,
    sendblue_number: null,
    service: "iMessage",
    group_display_name: null,
    ...overrides,
  };
}

describe("SendblueAdapter", () => {
  beforeEach(() => {
    sendMock.mockClear();
    groupSendMock.mockClear();
    postMock.mockClear();
    listMock.mockClear();
  });

  // -------------------------------------------------------------------------
  // Thread ID round-trip
  // -------------------------------------------------------------------------

  describe("encodeThreadId / decodeThreadId", () => {
    test("round-trips a 1:1 thread ID", () => {
      const adapter = createAdapter();
      const data = {
        fromNumber: "+13137386158",
        contactNumber: "+14155551234",
      };
      const encoded = adapter.encodeThreadId(data);
      expect(encoded).toStartWith("sendblue:");
      expect(adapter.decodeThreadId(encoded)).toEqual(data);
    });

    test("round-trips a group thread ID", () => {
      const adapter = createAdapter();
      const data = { fromNumber: "+13137386158", groupId: "group_xyz" };
      const encoded = adapter.encodeThreadId(data);
      expect(encoded).toContain(":g:");
      expect(adapter.decodeThreadId(encoded)).toEqual(data);
    });

    test("throws on invalid thread ID", () => {
      const adapter = createAdapter();
      expect(() => adapter.decodeThreadId("bad_id")).toThrow(
        "Invalid Sendblue thread ID",
      );
    });
  });

  // -------------------------------------------------------------------------
  // parseMessage
  // -------------------------------------------------------------------------

  describe("parseMessage", () => {
    test("produces correct Message fields from webhook payload", () => {
      const adapter = createAdapter();
      const payload = makePayload();
      const msg = adapter.parseMessage(payload);

      expect(msg.id).toBe("msg_abc");
      expect(msg.text).toBe("Hello from iMessage");
      expect(msg.author.userId).toBe("+14155551234");
      expect(msg.author.isBot).toBe(false);
      expect(msg.author.isMe).toBe(false);
      expect(msg.attachments).toHaveLength(0);
    });

    test("parses media_url as HTTP attachment", () => {
      const adapter = createAdapter();
      const payload = makePayload({
        media_url: "https://cdn.sendblue.co/photo.jpg",
      });
      const msg = adapter.parseMessage(payload);

      expect(msg.attachments).toHaveLength(1);
      expect(msg.attachments[0]!.type).toBe("image");
      expect(msg.attachments[0]!.mimeType).toBe("image/jpeg");
      expect(msg.attachments[0]!.url).toBe("https://cdn.sendblue.co/photo.jpg");
    });

    test("parses data: URI as attachment with decoded buffer", () => {
      const adapter = createAdapter();
      const b64 = Buffer.from("fake-image-data").toString("base64");
      const payload = makePayload({
        media_url: `data:image/png;base64,${b64}`,
      });
      const msg = adapter.parseMessage(payload);

      expect(msg.attachments).toHaveLength(1);
      expect(msg.attachments[0]!.type).toBe("image");
      expect(msg.attachments[0]!.mimeType).toBe("image/png");
      expect(msg.attachments[0]!.data).toBeInstanceOf(Buffer);
    });
  });

  // -------------------------------------------------------------------------
  // postMessage
  // -------------------------------------------------------------------------

  describe("postMessage", () => {
    test("sends via sdk.messages.send with correct params", async () => {
      const adapter = createAdapter();
      const threadId = adapter.encodeThreadId({
        fromNumber: "+13137386158",
        contactNumber: "+14155551234",
      });

      await adapter.postMessage(threadId, "Hello!");

      expect(sendMock).toHaveBeenCalledTimes(1);
      const args = (sendMock.mock.calls as unknown[][])[0]![0] as Record<
        string,
        unknown
      >;
      expect(args.number).toBe("+14155551234");
      expect(args.from_number).toBe("+13137386158");
      expect(args.content).toBe("Hello!");
    });

    test("skips sending empty content", async () => {
      const adapter = createAdapter();
      const threadId = adapter.encodeThreadId({
        fromNumber: "+13137386158",
        contactNumber: "+14155551234",
      });

      const result = await adapter.postMessage(threadId, "   ");

      expect(sendMock).not.toHaveBeenCalled();
      expect(result.id).toBe("");
    });

    test("strips markdown from outbound messages", async () => {
      const adapter = createAdapter();
      const threadId = adapter.encodeThreadId({
        fromNumber: "+13137386158",
        contactNumber: "+14155551234",
      });

      await adapter.postMessage(threadId, { markdown: "**bold** text" });

      const args = (sendMock.mock.calls as unknown[][])[0]![0] as Record<
        string,
        unknown
      >;
      expect(args.content).toBe("bold text");
    });
  });

  // -------------------------------------------------------------------------
  // sendMediaMessage
  // -------------------------------------------------------------------------

  describe("sendMediaMessage", () => {
    test("sends message with media_url", async () => {
      const adapter = createAdapter();
      const threadId = adapter.encodeThreadId({
        fromNumber: "+13137386158",
        contactNumber: "+14155551234",
      });

      await adapter.sendMediaMessage(
        threadId,
        "https://app.midday.ai/midday-contact.vcf",
      );

      expect(sendMock).toHaveBeenCalledTimes(1);
      const args = (sendMock.mock.calls as unknown[][])[0]![0] as Record<
        string,
        unknown
      >;
      expect(args.media_url).toBe("https://app.midday.ai/midday-contact.vcf");
      expect(args.content).toBe("");
    });

    test("skips sending for group threads", async () => {
      const adapter = createAdapter();
      const threadId = adapter.encodeThreadId({
        fromNumber: "+13137386158",
        groupId: "group_xyz",
      });

      await adapter.sendMediaMessage(threadId, "https://example.com/file.vcf");

      expect(sendMock).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // handleWebhook
  // -------------------------------------------------------------------------

  describe("handleWebhook", () => {
    test("rejects request with wrong webhook secret", async () => {
      const adapter = createAdapter();
      const request = new Request("https://example.com/webhook", {
        method: "POST",
        headers: { "sb-signing-secret": "wrong-secret" },
        body: JSON.stringify(makePayload()),
      });

      const response = await adapter.handleWebhook(request);

      expect(response.status).toBe(401);
    });

    test("accepts request with correct webhook secret", async () => {
      const adapter = createAdapter();
      const request = new Request("https://example.com/webhook", {
        method: "POST",
        headers: { "sb-signing-secret": "test-webhook-secret" },
        body: JSON.stringify(makePayload()),
      });

      const response = await adapter.handleWebhook(request);

      expect(response.status).toBe(200);
    });

    test("returns 400 for invalid JSON body", async () => {
      const adapter = createAdapter();
      const request = new Request("https://example.com/webhook", {
        method: "POST",
        headers: { "sb-signing-secret": "test-webhook-secret" },
        body: "not json",
      });

      const response = await adapter.handleWebhook(request);

      expect(response.status).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  // channelIdFromThreadId
  // -------------------------------------------------------------------------

  test("channelIdFromThreadId returns adapter:from prefix", () => {
    const adapter = createAdapter();
    const threadId = adapter.encodeThreadId({
      fromNumber: "+13137386158",
      contactNumber: "+14155551234",
    });
    const channelId = adapter.channelIdFromThreadId(threadId);
    expect(channelId).toStartWith("sendblue:");
    expect(channelId.split(":")).toHaveLength(2);
  });
});
