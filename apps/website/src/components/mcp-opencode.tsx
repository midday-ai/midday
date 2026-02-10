"use client";

import { OpenCodeMcpLogo } from "@midday/app-store/logos";
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

type Tab = "curl" | "npm" | "bun" | "brew";

const installCommands: Record<Tab, string> = {
  curl: "curl -fsSL https://opencode.ai/install | bash",
  npm: "npm i -g opencode-ai",
  bun: "bun add -g opencode-ai",
  brew: "brew install anomalyco/tap/opencode",
};

export function MCPOpenCode() {
  const [apiKey, setApiKey] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("curl");

  const mcpConfig = useMemo(() => {
    const key = apiKey || "YOUR_API_KEY";
    return JSON.stringify(
      {
        mcpServers: {
          midday: {
            url: "https://api.midday.ai/mcp",
            headers: {
              Authorization: `Bearer ${key}`,
            },
          },
        },
      },
      null,
      2,
    );
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
              <div className="w-14 h-14 [&>img]:w-full [&>img]:h-full">
                <OpenCodeMcpLogo />
              </div>
              <div>
                <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider">
                  MCP Server
                </p>
                <h1 className="font-serif text-3xl sm:text-4xl text-foreground">
                  OpenCode
                </h1>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4 mb-8">
              <h2 className="font-serif text-xl sm:text-2xl text-foreground">
                Track time while you code
              </h2>
              <p className="font-sans text-base text-muted-foreground leading-relaxed">
                Start a timer for a client project, log hours, and check your
                tracked time—all from your terminal. Just ask "start timer for
                Acme Corp" or "how many hours did I work this week?"
              </p>
            </div>

            {/* Use Cases */}
            <div className="space-y-3 mb-8 p-4 bg-secondary/50 border border-border">
              <p className="font-sans text-sm font-medium text-foreground">
                What you can do
              </p>
              <ul className="space-y-2">
                <li className="font-sans text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-foreground">•</span>
                  "Start timer for [customer name]"
                </li>
                <li className="font-sans text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-foreground">•</span>
                  "Stop timer and log 2 hours of backend work"
                </li>
                <li className="font-sans text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-foreground">•</span>
                  "How many hours did I track this week?"
                </li>
                <li className="font-sans text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-foreground">•</span>
                  "Show unbilled time for Acme Corp"
                </li>
              </ul>
            </div>

            {/* Install OpenCode */}
            <div className="space-y-4 mb-8">
              <h3 className="font-sans text-sm font-medium text-foreground">
                Install OpenCode
              </h3>
              <div className="flex border-b border-border">
                {(["curl", "npm", "bun", "brew"] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-sans transition-colors relative ${
                      activeTab === tab
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground -mb-[1px]" />
                    )}
                  </button>
                ))}
              </div>
              <CodeBlock code={installCommands[activeTab]} />
              <p className="font-sans text-xs text-muted-foreground">
                Desktop app and IDE extensions also available at{" "}
                <a
                  href="https://opencode.ai/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  opencode.ai/download
                </a>
              </p>
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

            {/* MCP Configuration */}
            <div className="space-y-4">
              <h3 className="font-sans text-sm font-medium text-foreground">
                MCP Configuration
              </h3>
              <p className="font-sans text-sm text-muted-foreground">
                Add to your OpenCode MCP config file:
              </p>
              <CodeBlock code={mcpConfig} />
            </div>

            {/* Steps */}
            <div className="mt-12 space-y-4">
              <h3 className="font-sans text-sm font-medium text-foreground">
                Setup steps
              </h3>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-secondary border border-border flex items-center justify-center font-mono text-xs text-muted-foreground">
                    1
                  </span>
                  <span className="font-sans text-sm text-muted-foreground pt-0.5">
                    Install OpenCode using one of the commands above
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-secondary border border-border flex items-center justify-center font-mono text-xs text-muted-foreground">
                    2
                  </span>
                  <span className="font-sans text-sm text-muted-foreground pt-0.5">
                    Get an API key from{" "}
                    <Link
                      href="https://app.midday.ai/settings/developer"
                      className="underline hover:text-foreground"
                    >
                      Settings → Developer
                    </Link>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-secondary border border-border flex items-center justify-center font-mono text-xs text-muted-foreground">
                    3
                  </span>
                  <span className="font-sans text-sm text-muted-foreground pt-0.5">
                    Add the MCP configuration above to your OpenCode settings
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-secondary border border-border flex items-center justify-center font-mono text-xs text-muted-foreground">
                    4
                  </span>
                  <span className="font-sans text-sm text-muted-foreground pt-0.5">
                    Restart OpenCode and ask about your Midday data
                  </span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
