import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { MCPZed } from "@/components/mcp-zed";

const title = "Zed MCP Integration";
const description =
  "Connect Zed to your Midday data via Model Context Protocol. Query transactions, invoices, and reports from the fastest code editor.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Zed MCP",
    "Zed editor integration",
    "Model Context Protocol",
    "AI editor financial data",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/mcp/zed`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/mcp/zed`,
  },
};

export default function Page() {
  return <MCPZed />;
}
