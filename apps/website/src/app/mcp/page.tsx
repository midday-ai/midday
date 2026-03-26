import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { MCP } from "@/components/mcp";

const title = "AI Integrations via MCP — Claude, ChatGPT, Cursor & More";
const description =
  "Run your business from any AI tool via Model Context Protocol (MCP). Create invoices, export to your accountant, track time, and manage transactions from Cursor, Claude, ChatGPT, Raycast, or Zapier.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "MCP",
    "Model Context Protocol",
    "AI integration",
    "Claude MCP",
    "Cursor MCP",
    "business automation",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/mcp`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/mcp`,
  },
};

export default function Page() {
  return <MCP />;
}
