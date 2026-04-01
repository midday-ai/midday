export type BotPlatform = "dashboard" | "whatsapp" | "telegram" | "slack";

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
    default:
      return "";
  }
}
