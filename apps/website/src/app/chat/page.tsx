import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { Chat } from "@/components/chat";

const title = "Run your business from iMessage, WhatsApp, Slack & Telegram";
const description =
  "Get invoices paid, track time, manage expenses — right from iMessage, WhatsApp, Slack, or Telegram. Run your business from any chat app.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "iMessage business",
    "WhatsApp invoicing",
    "Slack time tracking",
    "Telegram bookkeeping",
    "chat assistant",
    "conversational finance",
    "business messaging",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/chat`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/chat`,
  },
};

export default function Page() {
  return <Chat />;
}
