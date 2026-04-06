import { Icons } from "@midday/ui/icons";
import { ChatPlatformPage } from "@/components/chat-platform-page";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Midday for Slack",
  description:
    "Run your business from Slack. Ask questions, upload receipts, track invoices, and get notifications — without leaving your workspace.",
  path: "/chat/slack",
  og: {
    title: "Midday for Slack",
    description: "Your business, without leaving Slack",
  },
  keywords: [
    "Slack business",
    "Slack invoicing",
    "Slack receipts",
    "Slack bookkeeping",
    "Midday Slack",
    "Slack finance bot",
    "Slack accounting",
  ],
});

const config = {
  name: "Slack",
  slug: "slack",
  appId: "slack",
  icon: <Icons.Slack size={40} className="h-10 w-10" />,
  description:
    "Connect Midday to Slack and manage your finances without leaving your workspace. Ask about your cash flow, upload receipts, track invoices — Midday works right in your DMs or a shared channel.",
  steps: [
    {
      title: "Open Apps in Midday",
      description:
        "Go to the Apps section in your Midday dashboard and find Slack.",
      href: "https://app.midday.ai/apps?app=slack",
    },
    {
      title: "Install to your workspace",
      description:
        "Click Connect and authorize Midday in your Slack workspace. Choose a channel or use direct messages.",
    },
    {
      title: "Start chatting",
      description:
        'Send your first message — try asking "What\'s my cash flow this month?" or upload a receipt.',
    },
  ],
  notifications: [
    "New transactions from connected bank accounts",
    "Invoice status changes (paid, overdue)",
    "Match suggestions for receipts and transactions",
    "Recurring invoice reminders",
  ],
  capabilities: [
    "Ask questions about your finances in plain language",
    "Upload receipts and documents directly in Slack",
    "Track invoices and get status updates",
    "Log time entries through conversation",
    "Get real-time notifications for transactions and invoices",
  ],
  settingsPath: "Apps \u2192 Slack \u2192 Settings",
};

export default function Page() {
  return <ChatPlatformPage config={config} />;
}
