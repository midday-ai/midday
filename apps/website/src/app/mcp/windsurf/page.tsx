import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { MCPWindsurf } from "@/components/mcp-windsurf";

const title = "Windsurf MCP Integration";
const description =
  "Connect Windsurf to your Midday data via Model Context Protocol. Query transactions, invoices, and reports from your AI IDE.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Windsurf MCP",
    "Windsurf integration",
    "Model Context Protocol",
    "AI IDE financial data",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/mcp/windsurf`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/mcp/windsurf`,
  },
};

export default function Page() {
  return <MCPWindsurf />;
}
