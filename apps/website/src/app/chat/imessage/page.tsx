import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { ChatPlatformPage } from "@/components/chat-platform-page";

const title = "Midday for iMessage";
const description =
  "Run your business from iMessage. Send receipts, create invoices, track time, and get notifications — all from your favorite messaging app.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "iMessage business",
    "iMessage invoicing",
    "iMessage receipts",
    "iMessage bookkeeping",
    "Midday iMessage",
    "business chat iMessage",
    "Sendblue",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/chat/imessage`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/chat/imessage`,
  },
};

const config = {
  name: "iMessage",
  slug: "imessage",
  appId: "sendblue",
  icon: (
    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.4 6.8c0-2.2 1.6-4 3.7-4.4C7.4 2.1 9 2 12 2c3 0 4.6.1 5.9.4 2.1.4 3.7 2.2 3.7 4.4v5.4c0 2.2-1.6 4-3.7 4.4-.8.2-1.8.3-3.2.3l-3.2 3.5c-.7.8-2 .3-2-.7v-2.8c-1.3 0-2.2-.1-2.9-.3-2.1-.4-3.7-2.2-3.7-4.4V6.8z" />
    </svg>
  ),
  headline: "Your business, right from iMessage",
  description:
    "Connect Midday to iMessage and manage your finances without leaving your conversations. Send a photo of a receipt, ask about your cash flow, create an invoice — Midday handles it all through natural conversation.",
  steps: [
    {
      title: "Open Apps in Midday",
      description:
        "Go to the Apps section in your Midday dashboard and find iMessage.",
      href: "https://app.midday.ai/apps?app=sendblue",
    },
    {
      title: "Connect iMessage",
      description:
        "Follow the setup flow to link your phone number. You'll receive a connection code to send from your device.",
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
  settingsPath: "Apps \u2192 iMessage \u2192 Settings",
};

export default function Page() {
  return <ChatPlatformPage config={config} />;
}
