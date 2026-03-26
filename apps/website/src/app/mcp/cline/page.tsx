import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { MCPCline } from "@/components/mcp-cline";

const title = "Cline MCP Integration";
const description =
  "Connect Cline to your Midday data via Model Context Protocol. Query transactions, invoices, and reports from VS Code.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Cline MCP",
    "Cline integration",
    "Model Context Protocol",
    "VS Code financial data",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/mcp/cline`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/mcp/cline`,
  },
};

export default function Page() {
  return <MCPCline />;
}
