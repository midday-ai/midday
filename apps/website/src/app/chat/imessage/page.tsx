import { Icons } from "@midday/ui/icons";
import { ChatPlatformPage } from "@/components/chat-platform-page";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Midday for iMessage",
  description:
    "Run your business from iMessage. Send receipts, create invoices, track time, and get notifications — all from your favorite messaging app.",
  path: "/chat/imessage",
  og: {
    title: "Midday for iMessage",
    description: "Your business, right in Messages",
  },
  keywords: [
    "iMessage business",
    "iMessage invoicing",
    "iMessage receipts",
    "iMessage bookkeeping",
    "Midday iMessage",
    "business chat iMessage",
    "Sendblue",
  ],
});

const config = {
  name: "iMessage",
  slug: "imessage",
  appId: "sendblue",
  icon: <Icons.IMessage size={40} className="h-10 w-10" />,
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
  settingsPath: "Apps \u2192 iMessage \u2192 Settings",
};

export default function Page() {
  return <ChatPlatformPage config={config} />;
}
