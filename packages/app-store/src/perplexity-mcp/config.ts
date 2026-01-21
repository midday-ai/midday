import { Logo } from "./assets/logo";

export default {
  name: "Perplexity",
  id: "perplexity-mcp",
  category: "ai-automation",
  active: true,
  logo: Logo,
  short_description:
    "Connect Perplexity to your Midday data with AI-powered search.",
  description: `Connect Perplexity to your Midday account using the Model Context Protocol (MCP).

**What you can do:**
- Query your financial data using natural language
- Get instant answers about transactions, invoices, and reports
- Combine Perplexity's AI search with your real business data

**How it works:**
1. Click Install to open the setup page
2. Add the MCP server configuration to Perplexity
3. Add your Midday API key and start asking questions`,
  images: [],
  installUrl: "https://midday.ai/mcp/perplexity",
};
