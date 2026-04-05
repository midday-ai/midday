import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { ChatPlatformPage } from "@/components/chat-platform-page";

const title = "Midday for Telegram";
const description =
  "Run your business from Telegram. Send receipts, create invoices, track time, and get notifications — all from the messaging app you already use.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Telegram business",
    "Telegram invoicing",
    "Telegram receipts",
    "Telegram bookkeeping",
    "Midday Telegram",
    "Telegram finance bot",
    "Telegram accounting",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/chat/telegram`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/chat/telegram`,
  },
};

const config = {
  name: "Telegram",
  slug: "telegram",
  appId: "telegram",
  icon: (
    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  ),
  headline: "Your business, right from Telegram",
  description:
    "Connect Midday to Telegram and manage your finances without leaving your conversations. Send a photo of a receipt, ask about your cash flow, create an invoice — Midday handles it all through natural conversation.",
  steps: [
    {
      title: "Open Apps in Midday",
      description:
        "Go to the Apps section in your Midday dashboard and find Telegram.",
      href: "https://app.midday.ai/apps?app=telegram",
    },
    {
      title: "Connect Telegram",
      description:
        "Click the link to open a chat with the Midday bot, then send the connection code to link your account.",
    },
    {
      title: "Start chatting",
      description:
        "Send your first message — try forwarding a receipt or asking \"What did I spend this week?\"",
    },
  ],
  notifications: [
    "New transactions from connected bank accounts",
    "Invoice status changes (paid, overdue)",
    "Receipt match suggestions",
    "Recurring invoice reminders",
  ],
  capabilities: [
    "Send receipts and PDFs — just snap a photo or forward a document",
    "Create and send invoices through conversation",
    "Track time by telling Midday what you worked on",
    "Ask questions about your finances in plain language",
    "Get real-time notifications for transactions and invoices",
  ],
  settingsPath: "Apps \u2192 Telegram \u2192 Settings",
};

export default function Page() {
  return <ChatPlatformPage config={config} />;
}
