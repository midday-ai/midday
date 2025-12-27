import { Logo } from "./assets/logo";

// Shared base config - used by both server and client configs
export const baseConfig = {
  name: "Telegram",
  id: "telegram",
  category: "Productivity",
  active: true,
  logo: Logo,
  short_description:
    "Forward receipts and invoices directly from Telegram. Midday automatically extracts data and matches them to transactions.",
  description:
    "Connect Midday with Telegram to capture receipts on the go.\n\n**Easy Setup**\nMessage the Midday bot with your unique code to connect your Telegram account. No app installation required.\n\n**Receipt & Invoice Upload**\nForward or send photos of receipts, invoices, or any documents directly from Telegram. Simply send an image or PDF and it will automatically be processed.\n\n**Smart Matching**\nMidday extracts key information (amount, date, vendor) from your documents and automatically matches them to the right transactions. You'll receive a message with the match result.\n\n**Approve or Decline**\nReview suggested matches and approve or decline them directly from Telegram with one tap—no need to open the Midday app.",
  settings: [
    {
      id: "receipts",
      label: "Receipt Processing",
      description:
        "Automatically process receipts and invoices sent via Telegram.",
      type: "switch",
      required: false,
      value: true,
    },
    {
      id: "matches",
      label: "Match Notifications",
      description:
        "Get notified when receipts are matched or need review via Telegram.",
      type: "switch",
      required: false,
      value: true,
    },
  ],
};
