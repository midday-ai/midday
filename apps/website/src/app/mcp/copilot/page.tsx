import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { MCPCopilot } from "@/components/mcp-copilot";

const title = "Microsoft Copilot MCP Integration";
const description =
  "Connect Midday to Microsoft Copilot Studio via MCP. Query invoices, transactions, and reports from Word, Excel, Outlook, or any Copilot-enabled app.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Microsoft Copilot MCP",
    "Copilot integration",
    "Model Context Protocol",
    "Microsoft 365",
    "enterprise AI",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/mcp/copilot`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/mcp/copilot`,
  },
};

export default function Page() {
  return <MCPCopilot />;
}
