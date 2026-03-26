import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { MCPGemini } from "@/components/mcp-gemini";

const title = "Gemini MCP Integration";
const description =
  "Connect Gemini CLI to your Midday data via Model Context Protocol. Query transactions, invoices, and reports from your terminal.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Gemini MCP",
    "Gemini CLI integration",
    "Model Context Protocol",
    "Google Gemini",
    "AI financial assistant",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/mcp/gemini`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/mcp/gemini`,
  },
};

export default function Page() {
  return <MCPGemini />;
}
