import { Icons } from "@midday/ui/icons";
import { ChatPlatformPage } from "@/components/chat-platform-page";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Midday for Telegram",
  description:
    "Run your business from Telegram. Send receipts, create invoices, track time, and get notifications — all from the messaging app you already use.",
  path: "/chat/telegram",
  og: {
    title: "Midday for Telegram",
    description: "Your business, right in Telegram",
  },
  keywords: [
    "Telegram business",
    "Telegram invoicing",
    "Telegram receipts",
    "Telegram bookkeeping",
    "Midday Telegram",
    "Telegram finance bot",
    "Telegram accounting",
  ],
});

const config = {
  name: "Telegram",
  slug: "telegram",
  appId: "telegram",
  icon: <Icons.Telegram size={40} className="h-10 w-10" />,
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
        'Send your first message — try forwarding a receipt or asking "What did I spend this week?"',
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
