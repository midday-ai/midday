export type BotPlatform = "dashboard" | "whatsapp" | "telegram" | "slack" | "sendblue";

export function getPlatformInstructions(platform: BotPlatform): string {
  switch (platform) {
    case "dashboard":
      return `

## Platform: Dashboard
- The dashboard supports clickable entity links and tables.
- If a file upload was processed, acknowledge it briefly and then continue helping with follow-up actions.`;
    case "whatsapp":
      return `

## Platform: WhatsApp
- Use short paragraphs or short lists instead of markdown tables.
- Do not rely on clickable entity links.
- Keep responses concise and easy to read on mobile.`;
    case "telegram":
      return `

## Platform: Telegram
- Keep responses concise and mobile-friendly.
- Avoid relying on wide tables.
- Inline buttons may be used for confirmations or next actions.`;
    case "slack":
      return `

## Platform: Slack
- Slack supports richer formatting than mobile messaging platforms.
- It is fine to use tables and richer summaries when helpful.`;
    case "sendblue":
      return `

## Platform: iMessage (via Sendblue)
- iMessage is plain text only — markdown formatting is not rendered.
- Keep responses concise and mobile-friendly.
- Avoid tables, headers, and code blocks.
- You can send images and files as attachments.`;
    default:
      return "";
  }
}
