import { MCPPerplexity } from "@/components/mcp-perplexity";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP for Perplexity",
  description:
    "Connect Perplexity to your Midday data. Query transactions, invoices, and financial reports with natural language.",
};

export default function Page() {
  return <MCPPerplexity />;
}
