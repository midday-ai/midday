import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { MCPRaycast } from "@/components/mcp-raycast";

const title = "Raycast MCP Integration";
const description =
  "Access Midday financial data directly from Raycast via MCP. Keyboard-first access to invoices, transactions, and business reports.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Raycast MCP",
    "Raycast integration",
    "Model Context Protocol",
    "Raycast extension",
    "productivity tools",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/mcp/raycast`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/mcp/raycast`,
  },
};

export default function Page() {
  return <MCPRaycast />;
}
