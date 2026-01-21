import { Logo } from "./assets/logo";

export default {
  name: "Zapier",
  id: "zapier-mcp",
  category: "ai-automation",
  active: true,
  logo: Logo,
  short_description:
    "Connect Midday to 7,000+ apps. Automate reports, alerts, and workflows.",
  description: `Connect Midday to Zapier using the Model Context Protocol (MCP).

**What you can do:**
- Automate weekly profit reports to email or Slack
- Get alerts when invoices are overdue
- Sync customer data to Google Sheets or your CRM
- Build custom workflows without code

**How it works:**
1. Add Midday as an MCP connection in Zapier
2. Use your Midday API key for authentication
3. Create Zaps using Midday's 50+ tools`,
  images: [],
  installUrl: "https://midday.ai/mcp/zapier",
};
