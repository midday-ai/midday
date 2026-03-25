import { Logo } from "./assets/logo";

export default {
  name: "Cursor",
  id: "cursor-mcp",
  category: "ai-automation",
  active: true,
  logo: Logo,
  short_description:
    "Connect Cursor to your Midday data via MCP. Ask questions about finances while you code.",
  description: `Connect Cursor to your Midday account using the Model Context Protocol (MCP). No API key needed — authentication is handled automatically via OAuth.

**What you can do:**
- Track time and log expenses without leaving your editor
- Ask about transactions, invoices, and customers
- Generate financial reports and summaries
- Query your business data using natural language

**How it works:**
1. Click Install to open the setup page
2. Add the MCP server to Cursor
3. When you first use a Midday tool, sign in and select a team`,
  images: [],
  installUrl: "https://midday.ai/mcp/cursor",
};
