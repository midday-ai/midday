import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { MCP } from "@/components/mcp";

const title = "AI Integrations via MCP";
const description =
  "Connect AI tools to your business data via Model Context Protocol (MCP). Use Cursor, Claude, ChatGPT, Raycast, or Zapier to query finances and automate workflows.";

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
