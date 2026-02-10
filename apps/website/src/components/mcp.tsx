"use client";

import {
  ChatGPTMcpLogo,
  ClaudeMcpLogo,
  CopilotMcpLogo,
  CursorMcpLogo,
  MakeMcpLogo,
  N8nMcpLogo,
  OpenCodeMcpLogo,
  PerplexityMcpLogo,
  RaycastMcpLogo,
  ZapierMcpLogo,
} from "@midday/app-store/logos";
import { Button } from "@midday/ui/button";
import Image from "next/image";
import Link from "next/link";
import { MaterialIcon } from "./homepage/icon-mapping";

const clients = [
  {
    id: "cursor",
    name: "Cursor",
    description: "Track time for clients while you code",
    href: "/mcp/cursor",
  },
  {
    id: "claude",
    name: "Claude",
    description: "Analyze trends and get insights",
    href: "/mcp/claude",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    description: "AI search with your real data",
    href: "/mcp/perplexity",
  },
  {
    id: "raycast",
    name: "Raycast",
    description: "Quick answers, one shortcut away",
    href: "/mcp/raycast",
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    description: "Build custom integrations",
    href: "/mcp/chatgpt",
  },
  {
    id: "opencode",
    name: "OpenCode",
    description: "Track time for clients from your terminal",
    href: "/mcp/opencode",
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Automate workflows with 7,000+ apps",
    href: "/mcp/zapier",
  },
  {
    id: "copilot",
    name: "Microsoft Copilot",
    description: "Query data from Microsoft 365",
    href: "/mcp/copilot",
  },
  {
    id: "n8n",
    name: "n8n",
    description: "Automate workflows with AI agents",
    href: "/mcp/n8n",
  },
  {
    id: "make",
    name: "Make",
    description: "Visual automations with 1,500+ apps",
    href: "/mcp/make",
  },
];

const questions = [
  "How much runway do we have?",
  "Which invoices are overdue?",
  "What did we spend on software?",
  "Show me revenue compared to last year",
  "Who are our top customers?",
  "What's my burn rate?",
  "Display latest transactions",
  "Show me expense breakdown",
  "What is my profit margin?",
  "How is my revenue trending?",
  "Where am I spending the most?",
  "Can I afford to hire?",
  "What is my runway?",
  "Display latest invoices",
  "View all recent payments",
];

const capabilities = [
  "50+ tools across transactions, invoices, customers, tracker, and reports",
  "Granular permissions—read-only or full access, you choose",
  "Secure authentication with your existing API keys",
  "Works with Cursor, Claude, Perplexity, Raycast, Zapier, n8n, Make, and more",
];

function ClientLogo({
  id,
  size = "md",
  variant = "default",
}: {
  id: string;
  size?: "sm" | "md";
  variant?: string;
}) {
  const logos: Record<string, React.ComponentType<{ id?: string }>> = {
    cursor: CursorMcpLogo,
    claude: ClaudeMcpLogo,
    perplexity: PerplexityMcpLogo,
    raycast: RaycastMcpLogo,
    chatgpt: ChatGPTMcpLogo,
    opencode: OpenCodeMcpLogo,
    zapier: ZapierMcpLogo,
    copilot: CopilotMcpLogo,
    n8n: N8nMcpLogo,
    make: MakeMcpLogo,
  };

  const Logo = logos[id];
  if (!Logo) return null;

  const containerSize = size === "sm" ? "w-10 h-10" : "w-12 h-12";
  const uniqueId = `${id}-${variant}`;

  return (
    <div
      className={`${containerSize} [&>img]:w-full [&>img]:h-full [&>svg]:w-full [&>svg]:h-full`}
    >
      <Logo id={uniqueId} />
    </div>
  );
}

export function MCP() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-background relative overflow-visible lg:min-h-screen lg:overflow-hidden">
        {/* Grid Pattern Background - Desktop Only */}
        <div className="hidden lg:flex absolute inset-0 items-center justify-center pointer-events-none z-0">
          <Image
            src="/images/grid-light.svg"
            alt="Grid Pattern"
            width={1728}
            height={1080}
            className="w-[1728px] h-screen object-cover opacity-100 dark:opacity-[12%] dark:hidden"
            loading="lazy"
          />
          <Image
            src="/images/grid-dark.svg"
            alt="Grid Pattern"
            width={1728}
            height={1080}
            className="w-[1728px] h-screen object-cover opacity-[12%] hidden dark:block"
            loading="lazy"
          />
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden flex flex-col relative pt-32 pb-16 sm:pt-40 sm:pb-20 md:pt-48 overflow-hidden">
          {/* Grid Pattern Background - Mobile/Tablet Only */}
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-0"
            style={{ height: "600px" }}
          >
            <Image
              src="/images/grid-light.svg"
              alt="Grid Pattern"
              width={1728}
              height={1080}
              className="w-full h-[600px] object-cover opacity-100 dark:opacity-[12%] dark:hidden"
              loading="lazy"
            />
            <Image
              src="/images/grid-dark.svg"
              alt="Grid Pattern"
              width={1728}
              height={1080}
              className="w-full h-[600px] object-cover opacity-[12%] hidden dark:block"
              loading="lazy"
            />
          </div>
          <div className="flex flex-col justify-start items-center z-20 px-4 sm:px-6">
            {/* Title and Description */}
            <div className="space-y-4 text-center max-w-xl w-full">
              <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider">
                AI Integrations
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight text-foreground">
                Midday, everywhere
              </h1>
              <p className="text-muted-foreground text-base leading-normal font-sans text-center mx-auto">
                Connect Claude, ChatGPT, Perplexity, Cursor, and more to your
                Midday data. Ask questions and get answers from your actual
                business data.
              </p>
            </div>

            {/* Client Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 w-full max-w-4xl mt-12">
              {clients.map((client) => (
                <Link
                  key={client.id}
                  href={client.href}
                  className="group border border-border bg-background p-4 sm:p-5 flex flex-col items-start hover:border-foreground/20 transition-all duration-200"
                >
                  <div className="mb-2 sm:mb-3">
                    <ClientLogo id={client.id} size="sm" variant="mobile" />
                  </div>
                  <h3 className="font-sans text-xs sm:text-sm font-medium text-foreground mb-0.5 sm:mb-1">
                    {client.name}
                  </h3>
                  <p className="font-sans text-[10px] sm:text-xs text-muted-foreground line-clamp-2">
                    {client.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex flex-col min-h-screen relative pt-40 overflow-hidden">
          <div className="flex-1 flex flex-col justify-center items-center z-20 px-4 pb-32">
            {/* Title and Description */}
            <div className="text-center space-y-4 w-full mb-16">
              <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider">
                AI Integrations
              </p>
              <h1 className="font-serif text-6xl xl:text-7xl 2xl:text-8xl leading-tight text-foreground">
                Midday, everywhere
              </h1>
              <p className="text-muted-foreground text-sm xl:text-base leading-normal max-w-2xl mx-auto font-sans text-center">
                Connect Claude, ChatGPT, Perplexity, Cursor, and more to your
                Midday data. Ask questions and get answers from your actual
                business data.
              </p>
            </div>

            {/* Client Cards */}
            <div className="grid grid-cols-5 gap-5 max-w-5xl">
              {clients.map((client) => (
                <Link
                  key={client.id}
                  href={client.href}
                  className="group border border-border bg-background p-5 flex flex-col items-start hover:border-foreground/20 hover:scale-[1.02] transition-all duration-200"
                >
                  <div className="mb-3">
                    <ClientLogo id={client.id} variant="desktop" />
                  </div>
                  <h3 className="font-sans text-sm font-medium text-foreground mb-1">
                    {client.name}
                  </h3>
                  <p className="font-sans text-xs text-muted-foreground line-clamp-2">
                    {client.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <section className="bg-background py-12 sm:py-16 lg:py-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="font-serif text-2xl sm:text-2xl text-foreground">
              Skip the dashboards
            </h2>
            <p className="font-sans text-base text-muted-foreground leading-normal max-w-xl mx-auto">
              Just ask.
            </p>
          </div>

          <div className="max-w-5xl mx-auto relative">
            {/* Gradient fade masks */}
            <div
              className="absolute inset-y-0 left-0 w-24 sm:w-32 z-10 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to right, hsl(var(--background)) 0%, hsl(var(--background)) 30%, hsla(var(--background), 0.8) 50%, hsla(var(--background), 0.4) 70%, transparent 100%)",
              }}
            />
            <div
              className="absolute inset-y-0 right-0 w-24 sm:w-32 z-10 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to left, hsl(var(--background)) 0%, hsl(var(--background)) 30%, hsla(var(--background), 0.8) 50%, hsla(var(--background), 0.4) 70%, transparent 100%)",
              }}
            />
            <div className="flex flex-wrap gap-x-1.5 gap-y-1.5 sm:gap-x-2 sm:gap-y-2 justify-center relative z-0">
              {questions.map((question, index) => {
                // Random pattern: only indices 0, 2, 6, 9, 12 get white text (less frequent)
                const highlightedIndices = [0, 2, 6, 9, 12];
                const textColors = highlightedIndices.includes(index)
                  ? "text-foreground"
                  : "text-muted-foreground";
                // Show first 8 on mobile, first 12 on tablet, all on desktop
                let visibilityClass = "";
                if (index >= 12) {
                  // Hide on mobile and tablet, show on desktop (lg+)
                  visibilityClass = "hidden lg:block";
                } else if (index >= 8) {
                  // Hide on mobile, show on tablet and desktop (md+)
                  visibilityClass = "hidden md:block";
                }
                return (
                  <div
                    key={question}
                    className={`px-3 py-1.5 bg-secondary rounded-tl-full rounded-tr-full rounded-bl-full ${visibilityClass}`}
                  >
                    <p
                      className={`font-sans text-xs sm:text-sm ${textColors} whitespace-nowrap`}
                    >
                      "{question}"
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Capabilities Section */}
      <section className="bg-background py-12 sm:py-16 lg:py-24">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground">
              Secure by design
            </h2>
            <p className="font-sans text-base text-muted-foreground leading-normal max-w-xl mx-auto">
              Full control over what your AI can access and modify.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-secondary border border-border p-6 relative">
              <div className="space-y-6">
                {capabilities.map((capability) => (
                  <div key={capability} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                      <MaterialIcon
                        name="check"
                        className="text-foreground"
                        size={14}
                      />
                    </div>
                    <span className="font-sans text-sm text-foreground">
                      {capability}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* CTA Section */}
      <div className="max-w-[1400px] mx-auto mt-24 pb-24">
        <div className="bg-background border border-border p-8 lg:p-12 text-center relative before:absolute before:inset-0 before:bg-[repeating-linear-gradient(-60deg,rgba(219,219,219,0.4),rgba(219,219,219,0.4)_1px,transparent_1px,transparent_6px)] dark:before:bg-[repeating-linear-gradient(-60deg,rgba(44,44,44,0.4),rgba(44,44,44,0.4)_1px,transparent_1px,transparent_6px)] before:pointer-events-none">
          <div className="relative z-10">
            <h2 className="font-serif text-2xl sm:text-2xl text-foreground mb-4">
              Get started
            </h2>
            <p className="font-sans text-base text-muted-foreground mb-6 max-w-lg mx-auto">
              Choose your AI client above. You'll need an API key from your
              Midday dashboard.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild className="h-11 px-6 text-sm font-sans">
                <Link href="https://app.midday.ai/settings/developer">
                  Get API key
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
