import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { Assistant } from "@/components/assistant";

const title = "AI Assistant for Small Business";
const description =
  "Manage your finances, invoices, time tracking, and connected tools from a single conversation. An AI assistant that knows your business and gets things done.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "AI assistant",
    "small business assistant",
    "AI bookkeeping",
    "invoice assistant",
    "business finance AI",
    "connected apps",
    "AI time tracking",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/assistant`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/assistant`,
  },
};

export default function Page() {
  return <Assistant />;
}
