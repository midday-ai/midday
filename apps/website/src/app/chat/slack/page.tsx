import { Icons } from "@midday/ui/icons";
import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { ChatPlatformPage } from "@/components/chat-platform-page";

const title = "Midday for Slack";
const description =
  "Run your business from Slack. Ask questions, upload receipts, track invoices, and get notifications — without leaving your workspace.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Slack business",
    "Slack invoicing",
    "Slack receipts",
    "Slack bookkeeping",
    "Midday Slack",
    "Slack finance bot",
    "Slack accounting",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/chat/slack`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/chat/slack`,
  },
};

const config = {
  name: "Slack",
  slug: "slack",
  appId: "slack",
  icon: <Icons.Slack size={40} className="h-10 w-10" />,
  headline: "Your business, right from Slack",
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
