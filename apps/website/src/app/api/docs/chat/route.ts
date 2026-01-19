import { openai } from "@ai-sdk/openai";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { streamText } from "ai";

const redis = Redis.fromEnv();

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 requests per hour per IP
  analytics: true,
  prefix: "docs-assistant",
});

const DOCS_SYSTEM_PROMPT = `You are Midday's documentation assistant. Help users understand how to use Midday - a financial operating system for SMB owners, freelancers, and small agencies.

You can answer questions about:
- **Invoicing**: Creating invoices, recurring invoices, scheduled delivery, online payments via Stripe, invoice templates, tracking payment status
- **Bank connections**: Connecting 20,000+ banks worldwide, syncing transactions, multi-currency support
- **Transactions**: Categorization, tags, filtering, search, manual entries
- **Receipt matching**: AI-powered matching, email forwarding, Gmail/Outlook integration, the Inbox feature
- **Time tracking**: Projects, timers, manual entries, billing tracked time, project estimates
- **Financial reports**: Revenue, profit, burn rate, runway analysis, spending by category
- **Exporting**: CSV export, Xero integration, QuickBooks integration, Fortnox integration
- **Customer management**: Customer portal, enrichment, invoice history
- **Team settings**: Inviting members, roles, notifications
- **Assistant**: Using the AI assistant in the dashboard, MCP integrations with Cursor/Claude/ChatGPT

Key product details:
- Midday auto-categorizes transactions using AI
- Receipt matching uses semantic AI to match documents to transactions
- Recurring invoices support daily, weekly, monthly, quarterly, yearly frequencies
- Online payments require Stripe connection
- Export to accountants works with Xero, QuickBooks, Fortnox, or CSV
- Reports show real-time revenue, profit, burn rate, and runway
- The inbox accepts receipts via email forwarding or connected email accounts

Keep answers concise and actionable. Use numbered steps for how-to questions.
When referencing documentation, mention the page name naturally (e.g., "check the Invoicing guide" or "see the Connect Bank documentation") without using markdown link syntax.
If you don't know something specific about Midday, say so rather than guessing.
Don't make up features that don't exist.`;

export async function POST(req: Request) {
  const isDev = process.env.NODE_ENV === "development";

  let remaining = 999;
  let reset = Date.now() + 3600000;

  // Skip rate limiting in development
  if (!isDev) {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0]?.trim() : "127.0.0.1";

    const result = await ratelimit.limit(ip ?? "127.0.0.1");
    remaining = result.remaining;
    reset = result.reset;

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Try again later.",
          remaining: 0,
          resetAt: reset,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        },
      );
    }
  }

  const { messages } = await req.json();

  const result = await streamText({
    model: openai("gpt-4o-mini"),
    system: DOCS_SYSTEM_PROMPT,
    messages,
  });

  return result.toTextStreamResponse({
    headers: {
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": reset.toString(),
    },
  });
}
