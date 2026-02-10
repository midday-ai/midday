"use client";

import { MakeMcpLogo } from "@midday/app-store/logos";
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

const automationExamples = [
  "Sync new invoices to Google Sheets automatically",
  "Send Slack notifications for overdue payments",
  "Create Notion tasks for expense approvals",
  "Update Airtable with transaction data",
];

export function MCPMake() {
  const [apiKey, setApiKey] = useState("");

  const connectionConfig = useMemo(() => {
    const key = apiKey || "YOUR_API_KEY";
    return `Server URL: https://api.midday.ai/mcp
Transport: SSE (Server-Sent Events)
Authentication: Bearer Token
Token: ${key}`;
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
                <MakeMcpLogo />
              </div>
              <div>
                <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider">
                  MCP Server
                </p>
                <h1 className="font-serif text-3xl sm:text-4xl text-foreground">
                  Make
                </h1>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4 mb-8">
              <h2 className="font-serif text-xl sm:text-2xl text-foreground">
                Visual automation with financial data
              </h2>
              <p className="font-sans text-base text-muted-foreground leading-relaxed">
                Connect Midday to Make.com scenarios via MCP. Use the MCP Client
                module to access your financial data in visual, no-code
                automations.
              </p>
            </div>

            {/* Use Cases */}
            <div className="space-y-3 mb-8 p-4 bg-secondary/50 border border-border">
              <p className="font-sans text-sm font-medium text-foreground">
                What you can automate
              </p>
              <ul className="space-y-2">
                {automationExamples.map((example) => (
                  <li
                    key={example}
                    className="font-sans text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-foreground">•</span>
                    {example}
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
                Use these settings when configuring the MCP Client module in
                Make:
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
                      Add MCP Client module
                    </span>
                    <p className="font-sans text-sm text-muted-foreground mt-1">
                      In your Make scenario, click (+) and search for "MCP
                      Client" module
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-secondary border border-border flex items-center justify-center font-mono text-xs text-muted-foreground">
                    2
                  </span>
                  <div className="pt-0.5">
                    <span className="font-sans text-sm text-foreground font-medium">
                      Configure the connection
                    </span>
                    <p className="font-sans text-sm text-muted-foreground mt-1">
                      Enter the Server URL:{" "}
                      <code className="font-mono bg-secondary px-1">
                        https://api.midday.ai/mcp
                      </code>
                    </p>
                    <p className="font-sans text-sm text-muted-foreground mt-1">
                      Select "SSE" as the transport method
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-secondary border border-border flex items-center justify-center font-mono text-xs text-muted-foreground">
                    3
                  </span>
                  <div className="pt-0.5">
                    <span className="font-sans text-sm text-foreground font-medium">
                      Add authentication
                    </span>
                    <p className="font-sans text-sm text-muted-foreground mt-1">
                      Get an API key from{" "}
                      <Link
                        href="https://app.midday.ai/settings/developer"
                        className="underline hover:text-foreground"
                      >
                        Settings → Developer
                      </Link>{" "}
                      and add it as a Bearer Token
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-secondary border border-border flex items-center justify-center font-mono text-xs text-muted-foreground">
                    4
                  </span>
                  <div className="pt-0.5">
                    <span className="font-sans text-sm text-foreground font-medium">
                      Select tools and map inputs
                    </span>
                    <p className="font-sans text-sm text-muted-foreground mt-1">
                      Browse available Midday tools, select one, and map the
                      input fields visually in the Make interface
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            {/* CTA */}
            <div className="mt-12 p-6 bg-secondary/50 border border-border">
              <h3 className="font-sans text-sm font-medium text-foreground mb-2">
                New to Make?
              </h3>
              <p className="font-sans text-sm text-muted-foreground mb-4">
                Make.com is a visual automation platform. Start with their free
                plan to build your first scenarios.
              </p>
              <Button asChild variant="outline" className="h-9 text-sm">
                <a
                  href="https://www.make.com/en/register"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Create free Make account
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
