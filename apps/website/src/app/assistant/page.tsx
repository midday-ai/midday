import { Assistant } from "@/components/assistant";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "AI Assistant for Small Business",
  description:
    "Manage your finances, invoices, time tracking, and connected tools from a single conversation. An AI assistant that knows your business and gets things done.",
  path: "/assistant",
  og: {
    title: "AI Assistant",
    description: "One conversation to run your entire business",
  },
  keywords: [
    "AI assistant",
    "small business assistant",
    "AI bookkeeping",
    "invoice assistant",
    "business finance AI",
    "connected apps",
    "AI time tracking",
  ],
});

export default function Page() {
  return <Assistant />;
}
