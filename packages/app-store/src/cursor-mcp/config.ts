import { Logo } from "./assets/logo";

export default {
  name: "Cursor",
  id: "cursor-mcp",
  category: "ai-automation",
  active: true,
  logo: Logo,
  short_description:
    "Connect Cursor to your Midday data via MCP. Ask questions about finances while you code.",
  description: `Connect Cursor to your Midday account using the Model Context Protocol (MCP).

**What you can do:**
- Track time and log expenses without leaving your editor
- Ask about transactions, invoices, and customers
- Generate financial reports and summaries
- Query your business data using natural language

**How it works:**
1. Click Install to open the setup page
2. Add your Midday API key to Cursor's MCP configuration
3. Restart Cursor and @-mention Midday in chat`,
  images: [],
  installUrl: "https://midday.ai/mcp/cursor",
};
