import { Logo } from "./assets/logo";

export const baseConfig = {
  name: "Telegram",
  id: "telegram",
  category: "capture",
  active: true,
  beta: true,
  logo: Logo,
  short_description:
    "Chat with Midday and forward receipts from Telegram using the same inbox pipeline.",
  description:
    "Connect Midday with Telegram to upload receipts, invoices, and documents from your phone.\n\n**Quick setup**\nOpen Telegram from Midday or scan the QR code to start the bot with your workspace inbox ID.\n\n**Shared inbox processing**\nImages and PDFs go through the same Midday inbox extraction and matching flow as dashboard chat and WhatsApp.\n\n**Assistant on the go**\nAsk Midday questions, review extracted files, and continue the same assistant experience from Telegram.",
  settings: [
    {
      id: "transactions",
      label: "Transactions",
      description:
        "Get grouped Telegram alerts when new transactions are imported.",
      type: "switch",
      required: false,
      value: true,
    },
    {
      id: "invoices",
      label: "Invoices",
      description:
        "Get Telegram alerts for paid, overdue, and upcoming recurring invoices.",
      type: "switch",
      required: false,
      value: true,
    },
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
        "Get notified when Telegram uploads are matched or need review.",
      type: "switch",
      required: false,
      value: true,
    },
  ],
  images: [],
};
