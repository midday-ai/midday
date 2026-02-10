import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { MCPCursor } from "@/components/mcp-cursor";

const title = "Cursor MCP Integration";
const description =
  "Connect Cursor to your Midday data via MCP. Track time, query finances, and access business data directly from your AI-powered code editor.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Cursor MCP",
    "Cursor integration",
    "Model Context Protocol",
    "AI coding assistant",
    "time tracking Cursor",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/mcp/cursor`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/mcp/cursor`,
  },
};

export default function Page() {
  return <MCPCursor />;
}
