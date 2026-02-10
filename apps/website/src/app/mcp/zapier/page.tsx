import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { MCPZapier } from "@/components/mcp-zapier";

const title = "Zapier MCP Integration";
const description =
  "Connect Midday to 7,000+ apps through Zapier via MCP. Automate financial reports, alerts, and workflows without writing code.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Zapier MCP",
    "Zapier integration",
    "Model Context Protocol",
    "workflow automation",
    "no-code automation",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/mcp/zapier`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/mcp/zapier`,
  },
};

export default function Page() {
  return <MCPZapier />;
}
