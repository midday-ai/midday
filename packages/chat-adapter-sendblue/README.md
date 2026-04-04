# chat-adapter-sendblue

[Sendblue](https://sendblue.co) adapter for [Chat SDK](https://chat-sdk.dev) — send and receive iMessage and SMS from your bot.

## Install

```bash
npm install chat-adapter-sendblue
```

## Quick start

```ts
import { Chat } from "chat";
import { createSendblueAdapter } from "chat-adapter-sendblue";

const chat = new Chat({
  userName: "my-bot",
  adapters: {
    sendblue: createSendblueAdapter(),
  },
});
```

The factory reads credentials from environment variables by default:

| Variable | Required | Description |
|---|---|---|
| `SENDBLUE_API_KEY` | Yes | Sendblue API key ID |
| `SENDBLUE_API_SECRET` | Yes | Sendblue API secret key |
| `SENDBLUE_FROM_NUMBER` | Yes | Your registered Sendblue phone number (E.164) |
| `SENDBLUE_WEBHOOK_SECRET` | No | Secret for webhook signature verification |
| `SENDBLUE_STATUS_CALLBACK_URL` | No | URL for outbound message status updates |

Or pass them explicitly:

```ts
createSendblueAdapter({
  apiKey: "sb-api-key-...",
  apiSecret: "sb-api-secret-...",
  defaultFromNumber: "+14155551234",
});
```

## Webhooks

Point your Sendblue webhook URLs to your server. The adapter handles three webhook types:

- **Inbound messages** — incoming iMessage/SMS routed to your bot
- **Outbound status** — delivery confirmations for messages you sent
- **Typing indicators** — when a contact starts typing

```ts
// Example: Hono / Express handler
app.post("/webhooks/sendblue", async (c) => {
  await chat.initialize();
  return chat.webhooks.sendblue(c.req.raw);
});
```

### Webhook verification

If you configure a webhook secret in Sendblue, pass it as `SENDBLUE_WEBHOOK_SECRET` (or in the config). The adapter checks the `x-webhook-secret` header on every request. You can override the header name:

```ts
createSendblueAdapter({
  webhookSecret: "my-secret",
  webhookSecretHeader: "x-custom-header",
});
```

## Features

### Sending messages

The adapter sends outbound iMessages (with SMS fallback) through Chat SDK's standard `postMessage` interface. Markdown is automatically stripped to plain text since iMessage does not render it.

```ts
await chat.send("sendblue", threadId, "Hello from the bot!");
```

### Attachments

Inbound media URLs from Sendblue are parsed into Chat SDK attachment objects with auto-detected MIME types. To send media, use Sendblue's `media_url` parameter through the SDK directly:

```ts
const adapter = chat.getAdapter("sendblue") as SendblueAdapter;
const sdk = adapter.getSdk();
await sdk.messages.send({
  number: "+15551234567",
  from_number: "+14155551234",
  content: "Check this out",
  media_url: "https://example.com/photo.jpg",
});
```

### Reactions (tapbacks)

iMessage tapbacks are supported via `addReaction`. The adapter maps common emoji names to Sendblue's six tapback types:

| Tapback | Aliases |
|---|---|
| `love` | `heart` |
| `like` | `thumbs_up`, `thumbsup`, `+1` |
| `dislike` | `thumbs_down`, `thumbsdown`, `-1` |
| `laugh` | `haha` |
| `emphasize` | `exclamation`, `!!` |
| `question` | `?` |

### Typing indicators

`startTyping()` sends the animated "..." bubble to the recipient. Only supported for 1:1 conversations (not group chats).

### Message history

`fetchMessages()` retrieves conversation history from the Sendblue API with cursor-based pagination.

### Number lookup

Check whether a phone number supports iMessage or SMS:

```ts
const adapter = chat.getAdapter("sendblue") as SendblueAdapter;
const result = await adapter.evaluateService("+15551234567");
// { number: "+15551234567", service: "iMessage" }
```

### Read receipts

Send read receipts for a conversation (requires Sendblue account-level activation):

```ts
const adapter = chat.getAdapter("sendblue") as SendblueAdapter;
await adapter.markRead(threadId);
```

### Direct SDK access

For anything not covered by the Chat SDK adapter interface, access the official [Sendblue SDK](https://www.npmjs.com/package/sendblue) directly:

```ts
const adapter = chat.getAdapter("sendblue") as SendblueAdapter;
const sdk = adapter.getSdk();

// Use any Sendblue API method
await sdk.contacts.list();
await sdk.groups.sendMessage({ ... });
await sdk.webhooks.list();
```

## Service filtering

By default, the adapter only processes inbound messages delivered via iMessage. To also accept SMS and RCS:

```ts
createSendblueAdapter({
  allowedServices: ["iMessage", "SMS", "RCS"],
});
```

## Thread ID format

Thread IDs encode the Sendblue line number and contact (or group) so that conversations are sticky to a specific phone line:

```
sendblue:<from_base64url>:<contact_base64url>       // 1:1
sendblue:<from_base64url>:g:<group_id_base64url>    // group
```

Use `encodeThreadId` / `decodeThreadId` to work with them programmatically.

## Platform limitations

- **No message editing** — iMessage does not support editing sent messages via API. `editMessage` throws.
- **No unsend** — `deleteMessage` is a soft-delete in Sendblue's database only.
- **No reaction removal** — tapbacks can be added but not removed via the API.
- **Inbound media expiry** — Sendblue inbound `media_url` values expire after 30 days. Persist them if needed.
- **Typing indicators** — only work for 1:1 chats, not group conversations.

## License

MIT
