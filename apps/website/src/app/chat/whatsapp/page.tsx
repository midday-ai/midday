import { Icons } from "@midday/ui/icons";
import { ChatPlatformPage } from "@/components/chat-platform-page";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Midday for WhatsApp",
  description:
    "Run your business from WhatsApp. Send receipts, create invoices, track time, and get notifications — all from the messaging app you already use.",
  path: "/chat/whatsapp",
  og: {
    title: "Midday for WhatsApp",
    description: "Your business, right in WhatsApp",
  },
  keywords: [
    "WhatsApp business",
    "WhatsApp invoicing",
    "WhatsApp receipts",
    "WhatsApp bookkeeping",
    "Midday WhatsApp",
    "business chat WhatsApp",
  ],
});

const config = {
  name: "WhatsApp",
  slug: "whatsapp",
  appId: "whatsapp",
  icon: <Icons.WhatsApp size={40} className="h-10 w-10 text-[#25D366]" />,
  description:
    "Connect Midday to WhatsApp and manage your finances without leaving your conversations. Send a photo of a receipt, ask about your cash flow, create an invoice — Midday handles it all through natural conversation.",
  steps: [
    {
      title: "Open Apps in Midday",
      description:
        "Go to the Apps section in your Midday dashboard and find WhatsApp.",
      href: "https://app.midday.ai/apps?app=whatsapp",
    },
    {
      title: "Connect WhatsApp",
      description:
        "Scan the QR code or copy the connection link to start a chat with the Midday WhatsApp number.",
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
  settingsPath: "Apps \u2192 WhatsApp \u2192 Settings",
};

export default function Page() {
  return <ChatPlatformPage config={config} />;
}
