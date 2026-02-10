"use client";

import { ClaudeMcpLogo } from "@midday/app-store/logos";
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

type Tab = "code" | "desktop";

export function MCPClaude() {
  const [apiKey, setApiKey] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("code");

  const cliCommand = useMemo(() => {
    const key = apiKey || "YOUR_API_KEY";
    return `claude mcp add --transport http midday https://api.midday.ai/mcp --header "Authorization: Bearer ${key}"`;
  }, [apiKey]);

  const desktopConfig = useMemo(() => {
    const key = apiKey || "YOUR_API_KEY";
    return JSON.stringify(
      {
        mcpServers: {
          midday: {
            command: "npx",
            args: [
              "-y",
              "mcp-remote@latest",
              "https://api.midday.ai/mcp",
              "--header",
              // biome-ignore lint/suspicious/noTemplateCurlyInString: Intentional shell variable reference in MCP config
              "Authorization:${AUTH_HEADER}",
            ],
            env: {
              AUTH_HEADER: `Bearer ${key}`,
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
                <ClaudeMcpLogo />
              </div>
              <div>
                <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider">
                  MCP Server
                </p>
                <h1 className="font-serif text-3xl sm:text-4xl text-foreground">
                  Claude
                </h1>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4 mb-8">
              <h2 className="font-serif text-xl sm:text-2xl text-foreground">
                Conversations with real numbers
              </h2>
              <p className="font-sans text-base text-muted-foreground leading-relaxed">
                Claude can pull live data from your Midday account to answer
                questions accurately. Works with both Claude Code and Claude
                Desktop.
              </p>
            </div>

            {/* API Key Input */}
            <div className="space-y-4 mb-8">
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
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <div className="flex border-b border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab("code")}
                  className={`px-4 py-2 text-sm font-sans transition-colors relative ${
                    activeTab === "code"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Claude Code
                  {activeTab === "code" && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground -mb-[1px]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("desktop")}
                  className={`px-4 py-2 text-sm font-sans transition-colors relative ${
                    activeTab === "desktop"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Claude Desktop
                  {activeTab === "desktop" && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground -mb-[1px]" />
                  )}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "code" && (
              <div className="space-y-4">
                <p className="font-sans text-sm text-muted-foreground">
                  Run this command in your terminal:
                </p>
                <CodeBlock code={cliCommand} />
              </div>
            )}

            {activeTab === "desktop" && (
              <div className="space-y-4">
                <p className="font-sans text-sm text-muted-foreground">
                  Add to your Claude Desktop config file:
                </p>
                <CodeBlock code={desktopConfig} />
                <p className="font-sans text-xs text-muted-foreground">
                  Requires{" "}
                  <a
                    href="https://www.npmjs.com/package/mcp-remote"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    mcp-remote
                  </a>{" "}
                  (installed automatically via npx)
                </p>
              </div>
            )}

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
                    2
                  </span>
                  <span className="font-sans text-sm text-muted-foreground pt-0.5">
                    {activeTab === "code"
                      ? "Run the command above in your terminal"
                      : "Add the config to your Claude Desktop settings"}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-secondary border border-border flex items-center justify-center font-mono text-xs text-muted-foreground">
                    3
                  </span>
                  <span className="font-sans text-sm text-muted-foreground pt-0.5">
                    {activeTab === "code"
                      ? "Use @midday in Claude Code to access your data"
                      : "Restart Claude Desktop and use Midday tools"}
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
