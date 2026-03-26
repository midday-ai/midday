"use client";

import { WindsurfMcpLogo } from "@midday/app-store/logos";
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

type Tab = "connect" | "advanced";

export function MCPWindsurf() {
  const [apiKey, setApiKey] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("connect");

  const settingsConfig = useMemo(() => {
    const key = apiKey || "YOUR_API_KEY";
    return JSON.stringify(
      {
        mcpServers: {
          midday: {
            serverUrl: "https://api.midday.ai/mcp",
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
      <div className="bg-background">
        <div className="pt-32 pb-16 sm:pt-40 sm:pb-20 md:pt-48 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            <Link
              href="/mcp"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 font-sans text-sm"
            >
              <Icons.ArrowBack size={16} />
              All clients
            </Link>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 [&>img]:w-full [&>img]:h-full [&>svg]:w-full [&>svg]:h-full">
                <WindsurfMcpLogo />
              </div>
              <div>
                <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider">
                  MCP Server
                </p>
                <h1 className="font-serif text-3xl sm:text-4xl text-foreground">
                  Windsurf
                </h1>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <h2 className="font-serif text-xl sm:text-2xl text-foreground">
                Financial data in Windsurf
              </h2>
              <p className="font-sans text-base text-muted-foreground leading-relaxed">
                Connect Midday to Windsurf and query your transactions,
                invoices, and reports directly from your AI IDE. Authentication
                is handled automatically via OAuth.
              </p>
            </div>

            <div className="mb-6">
              <div className="flex border-b border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab("connect")}
                  className={`px-4 py-2 text-sm font-sans transition-colors relative ${
                    activeTab === "connect"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Connect
                  {activeTab === "connect" && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground -mb-[1px]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("advanced")}
                  className={`px-4 py-2 text-sm font-sans transition-colors relative ${
                    activeTab === "advanced"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Advanced
                  {activeTab === "advanced" && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground -mb-[1px]" />
                  )}
                </button>
              </div>
            </div>

            {activeTab === "connect" && (
              <div className="space-y-6">
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
                        Open Windsurf and go to{" "}
                        <span className="font-medium text-foreground">
                          Settings → MCP Marketplace
                        </span>{" "}
                        (or edit{" "}
                        <span className="font-mono text-xs text-foreground">
                          mcp_config.json
                        </span>
                        )
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-secondary border border-border flex items-center justify-center font-mono text-xs text-muted-foreground">
                        2
                      </span>
                      <span className="font-sans text-sm text-muted-foreground pt-0.5">
                        Add a new server with URL:{" "}
                        <span className="font-mono text-xs text-foreground">
                          https://api.midday.ai/mcp
                        </span>
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-secondary border border-border flex items-center justify-center font-mono text-xs text-muted-foreground">
                        3
                      </span>
                      <span className="font-sans text-sm text-muted-foreground pt-0.5">
                        When prompted, sign in to Midday in your browser and
                        select a team
                      </span>
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {activeTab === "advanced" && (
              <div className="space-y-6">
                <p className="font-sans text-sm text-muted-foreground">
                  For manual setup using an API key instead of OAuth:
                </p>

                <div className="space-y-2">
                  <label
                    htmlFor="api-key"
                    className="font-sans text-sm text-foreground"
                  >
                    Your API key
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

                <div className="space-y-2">
                  <p className="font-sans text-sm text-muted-foreground">
                    Add to your{" "}
                    <span className="font-mono text-foreground text-xs">
                      mcp_config.json
                    </span>
                    :
                  </p>
                  <CodeBlock code={settingsConfig} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
