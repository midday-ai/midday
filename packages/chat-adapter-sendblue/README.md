# chat-adapter-sendblue

Sendblue iMessage/SMS/RCS adapter for Chat SDK.

## Vercel Connect readiness

The adapter supports first-class Connect integration without storing static
credentials in the application:

- `credentials` is a lazy provider invoked for **each outbound API call**.
  A future `connectSendblueAdapter()` helper should obtain a short-lived
  Connect token at that point and return `{ apiKey, apiSecret, defaultFromNumber }`.
- `webhookVerifier(request, body)` runs before JSON parsing and replaces the
  Sendblue shared-secret check. Pass Connect's OIDC verifier for
  trigger-forwarded webhooks.

```ts
createSendblueAdapter({
  credentials: async () => ({
    apiKey: "…",
    apiSecret: "…",
    defaultFromNumber: "+15555550100",
  }),
  webhookVerifier: async (request, body) => true,
});
```

`SENDBLUE_API_KEY`, `SENDBLUE_API_SECRET`, and `SENDBLUE_FROM_NUMBER` remain
supported for portable deployments. `webhookVerifier` takes precedence over
`webhookSecret`.

## Important limitations

The adapter exposes Sendblue tapbacks through `addReaction`, but Sendblue's
public API endpoint is not represented in the official SDK and reaction
removal is unavailable. Sendblue cannot edit or unsend iMessage messages;
configure eve's Chat SDK bridge with `streaming: false`.
