"use client";

import { CopilotMcpLogo } from "@midday/app-store/logos";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import Link from "next/link";
import { useMemo, useState } from "react";
import { highlight } from "sugar-high";

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const codeHTML = highlight(code);

  return (
    <div className="relative group">
      <div className="bg-[#fafafa] dark:bg-[#0c0c0c] border border-border rounded-none overflow-hidden">
        <pre className="overflow-x-auto p-4 text-sm font-mono">
          <code dangerouslySetInnerHTML={{ __html: codeHTML }} />
        </pre>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-3 right-3 p-1.5 bg-background/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground hover:bg-background transition-colors opacity-0 group-hover:opacity-100 rounded-none"
        aria-label="Copy code"
      >
        {copied ? (
          <Icons.Check size={14} className="text-foreground" />
        ) : (
          <Icons.Copy size={14} />
        )}
      </button>
    </div>
  );
}

const examplePrompts = [
  "What invoices are overdue?",
  "Show my profit for last month",
  "How much did I spend on software?",
  "List my top 5 customers by revenue",
];

export function MCPCopilot() {
  const [apiKey, setApiKey] = useState("");

  const connectionConfig = useMemo(() => {
    const key = apiKey || "YOUR_API_KEY";
    return `Server URL: https://api.midday.ai/mcp
Authentication: API Key
Header Name: Authorization
Header Value: Bearer ${key}`;
  }, [apiKey]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-background">
        <div className="pt-32 pb-16 sm:pt-40 sm:pb-20 md:pt-48 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            {/* Back Link */}
            <Link
              href="/mcp"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 font-sans text-sm"
            >
              <Icons.ArrowBack size={16} />
              All clients
            </Link>

            {/* Logo and Title */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 [&>svg]:w-full [&>svg]:h-full">
                <CopilotMcpLogo />
              </div>
              <div>
                <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider">
                  MCP Server
                </p>
                <h1 className="font-serif text-3xl sm:text-4xl text-foreground">
                  Microsoft Copilot
                </h1>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4 mb-8">
              <h2 className="font-serif text-xl sm:text-2xl text-foreground">
                Query your business data from Microsoft 365
              </h2>
              <p className="font-sans text-base text-muted-foreground leading-relaxed">
                Connect Midday to Microsoft Copilot Studio. Ask about invoices,
                transactions, and reports from Word, Excel, Outlook, or any
                Copilot-enabled app.
              </p>
            </div>

            {/* Use Cases */}
            <div className="space-y-3 mb-8 p-4 bg-secondary/50 border border-border">
              <p className="font-sans text-sm font-medium text-foreground">
                What you can ask
              </p>
              <ul className="space-y-2">
                {examplePrompts.map((prompt) => (
                  <li
                    key={prompt}
                    className="font-sans text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-foreground">"</span>
                    {prompt}
                    <span className="text-foreground">"</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Divider */}
            <div className="h-px w-full border-t border-border mb-8" />

            {/* API Key Input */}
            <div className="space-y-4 mb-8">
              <div className="space-y-2">
                <label
                  htmlFor="api-key"
                  className="font-sans text-sm text-foreground"
                >
                  Your Midday API key
                </label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="mid_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="font-sans text-xs text-muted-foreground">
                  Don't have an API key?{" "}
                  <Link
                    href="https://app.midday.ai/settings/developer"
                    className="underline hover:text-foreground"
                  >
                    Create one in Settings → Developer
                  </Link>
                </p>
              </div>
            </div>

            {/* Connection Details */}
            <div className="space-y-4 mb-8">
              <h3 className="font-sans text-sm font-medium text-foreground">
                Connection details
              </h3>
              <p className="font-sans text-sm text-muted-foreground">
                Use these settings when adding Midday as an MCP server in
                Copilot Studio:
              </p>
              <CodeBlock code={connectionConfig} />
            </div>

            {/* Steps */}
            <div className="mt-12 space-y-4">
              <h3 className="font-sans text-sm font-medium text-foreground">
                Setup steps
              </h3>
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-secondary border border-border flex items-center justify-center font-mono text-xs text-muted-foreground">
                    1
                  </span>
                  <div className="pt-0.5">
                    <span className="font-sans text-sm text-foreground font-medium">
                      Open Copilot Studio
                    </span>
                    <p className="font-sans text-sm text-muted-foreground mt-1">
                      Go to{" "}
                      <a
                        href="https://copilotstudio.microsoft.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-foreground"
                      >
                        copilotstudio.microsoft.com
                      </a>{" "}
                      and open your agent (or create a new one)
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-secondary border border-border flex items-center justify-center font-mono text-xs text-muted-foreground">
                    2
                  </span>
                  <div className="pt-0.5">
                    <span className="font-sans text-sm text-foreground font-medium">
                      Add an MCP server
                    </span>
                    <p className="font-sans text-sm text-muted-foreground mt-1">
                      Go to{" "}
                      <strong>
                        Tools → Add a tool → New tool → Model Context Protocol
                      </strong>
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-secondary border border-border flex items-center justify-center font-mono text-xs text-muted-foreground">
                    3
                  </span>
                  <div className="pt-0.5">
                    <span className="font-sans text-sm text-foreground font-medium">
                      Configure the connection
                    </span>
                    <p className="font-sans text-sm text-muted-foreground mt-1">
                      Enter the server URL:{" "}
                      <code className="font-mono bg-secondary px-1">
                        https://api.midday.ai/mcp
                      </code>
                    </p>
                    <p className="font-sans text-sm text-muted-foreground mt-1">
                      Select "API Key" authentication and add your key as a
                      Bearer token in the Authorization header
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-secondary border border-border flex items-center justify-center font-mono text-xs text-muted-foreground">
                    4
                  </span>
                  <div className="pt-0.5">
                    <span className="font-sans text-sm text-foreground font-medium">
                      Start using Midday tools
                    </span>
                    <p className="font-sans text-sm text-muted-foreground mt-1">
                      Midday's tools will appear in your agent. Ask questions
                      about invoices, transactions, customers, and more.
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Requirements */}
            <div className="mt-12 p-6 bg-secondary/50 border border-border">
              <h3 className="font-sans text-sm font-medium text-foreground mb-2">
                Requirements
              </h3>
              <ul className="space-y-2">
                <li className="font-sans text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-foreground">•</span>
                  Microsoft 365 license with Copilot Studio access
                </li>
                <li className="font-sans text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-foreground">•</span>
                  Midday API key (create in Settings → Developer)
                </li>
              </ul>
              <div className="mt-4">
                <Button asChild variant="outline" className="h-9 text-sm">
                  <a
                    href="https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-add-existing-server-to-agent"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Microsoft documentation
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
