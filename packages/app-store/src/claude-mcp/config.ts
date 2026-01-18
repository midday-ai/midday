import { Logo } from "./assets/logo";

export default {
  name: "Claude MCP",
  id: "claude-mcp",
  category: "AI",
  active: true,
  logo: Logo,
  short_description:
    "Connect Claude to your Midday data via MCP. Get financial answers grounded in real numbers.",
  description: `Connect Claude to your Midday account using the Model Context Protocol (MCP).

**What you can do:**
- Analyze financial trends and patterns
- Get insights from your transaction history
- Ask questions about invoices, customers, and reports
- Have conversations grounded in your real business data

**How it works:**
1. Click Install to open the setup page
2. Use the Claude CLI or Desktop app configuration
3. Add your Midday API key and start chatting

All queries are **read-only** — your data can be accessed but never modified.`,
  images: [],
  installUrl: "https://midday.ai/mcp/claude",
};
