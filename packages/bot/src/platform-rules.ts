export type BotPlatform =
  | "dashboard"
  | "whatsapp"
  | "telegram"
  | "slack"
  | "sendblue";

export function getPlatformInstructions(platform: BotPlatform): string {
  switch (platform) {
    case "dashboard":
      return `

## Platform: Dashboard
- The dashboard supports clickable entity links and tables.
- Before your first tool call, emit one short sentence (under 10 words) about what you're doing.
- If a file upload was processed, acknowledge it briefly and then continue helping with follow-up actions.`;
    case "whatsapp":
      return `

## Platform: WhatsApp
- Produce ZERO text output until you have the final result ready to present. No narration, no intermediate results.
- Do NOT use entity links like [Name](#inv:ID), [Name](#txn:ID), or [Name](#cust:ID) — those only work on the dashboard. When a tool returns a previewUrl, include it as a plain URL the user can tap.
- Use short paragraphs or short lists instead of markdown tables. For 3+ items, use a compact numbered list.
- After creating a draft invoice, respond with ONE message: the key details (customer, line items, total) + the preview link + ask if the user wants to send it. Nothing else.
- After any action, suggest the logical next step in one sentence.
- Do NOT check for existing unpaid invoices or provide unsolicited information. Only do exactly what the user asked.`;
    case "telegram":
      return `

## Platform: Telegram
- Produce ZERO text output until you have the final result ready to present. No narration, no intermediate results.
- Do NOT use entity links like [Name](#inv:ID), [Name](#txn:ID), or [Name](#cust:ID) — those only work on the dashboard. When a tool returns a previewUrl, include it as a plain URL the user can tap.
- Use short paragraphs or compact lists instead of wide tables.
- After creating a draft invoice, respond with ONE message: the key details (customer, line items, total) + the preview link + ask if the user wants to send it. Nothing else.
- After any action, suggest the logical next step in one sentence.
- Do NOT check for existing unpaid invoices or provide unsolicited information. Only do exactly what the user asked.`;
    case "slack":
      return `

## Platform: Slack
- Slack supports richer formatting than mobile messaging platforms.
- It is fine to use tables and richer summaries when helpful.`;
    case "sendblue":
      return `

## Platform: iMessage (via Sendblue)
- iMessage is plain text only — no markdown rendering. Avoid tables, headers, and code blocks.
- Produce ZERO text output until you have the final result ready to present. No narration, no intermediate results.
- Do NOT use entity links like [Name](#inv:ID), [Name](#txn:ID), or [Name](#cust:ID) — those only work on the dashboard. When a tool returns a previewUrl, include it as a plain URL the user can tap.
- After creating a draft invoice, respond with ONE message: the key details (customer, line items, total) + the preview link + ask if the user wants to send it. Nothing else.
- After any action, suggest the logical next step in one sentence.
- Use short plain-text lists for 3+ items.
- Do NOT check for existing unpaid invoices or provide unsolicited information. Only do exactly what the user asked.`;
    default:
      return "";
  }
}
