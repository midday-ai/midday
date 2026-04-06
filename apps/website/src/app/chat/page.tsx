import { Chat } from "@/components/chat";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Run your business from iMessage, WhatsApp, Slack & Telegram",
  description:
    "Get invoices paid, track time, manage expenses — right from iMessage, WhatsApp, Slack, or Telegram. Run your business from any chat app.",
  path: "/chat",
  og: {
    title: "Chat",
    description: "Run your business from any messaging app",
  },
  keywords: [
    "iMessage business",
    "WhatsApp invoicing",
    "Slack time tracking",
    "Telegram bookkeeping",
    "chat assistant",
    "conversational finance",
    "business messaging",
  ],
});

export default function Page() {
  return <Chat />;
}
