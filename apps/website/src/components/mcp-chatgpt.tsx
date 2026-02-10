"use client";

import { ChatGPTMcpLogo } from "@midday/app-store/logos";
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

type Tab = "developer" | "sdk";

export function MCPChatGPT() {
  const [apiKey, setApiKey] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("developer");

  const developerConfig = useMemo(() => {
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

  const sdkCode = useMemo(() => {
    const key = apiKey || "YOUR_API_KEY";
    return `import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const transport = new StreamableHTTPClientTransport({
  url: "https://api.midday.ai/mcp",
  headers: {
    Authorization: "Bearer ${key}",
  },
});

const client = new Client({
  name: "my-app",
  version: "1.0.0",
});

await client.connect(transport);

// List available tools
const tools = await client.listTools();
console.log(tools);

// Call a tool
const result = await client.callTool({
  name: "transactions_list",
  arguments: {
    pageSize: 10,
    type: "expense",
  },
});
console.log(result);

await client.close();`;
  }, [apiKey]);

  const installCode = "npm install @modelcontextprotocol/sdk";

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
              <Icons.ChevronLeft size={16} />
              All clients
            </Link>

            {/* Logo and Title */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 [&>img]:w-full [&>img]:h-full">
                <ChatGPTMcpLogo />
              </div>
              <div>
                <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider">
                  MCP Server
                </p>
                <h1 className="font-serif text-3xl sm:text-4xl text-foreground">
                  ChatGPT
                </h1>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4 mb-8">
              <h2 className="font-serif text-xl sm:text-2xl text-foreground">
                Financial data in ChatGPT
              </h2>
              <p className="font-sans text-base text-muted-foreground leading-relaxed">
                ChatGPT supports MCP servers in developer mode. Connect Midday
                to query your transactions, invoices, and reports directly in
                ChatGPT conversations.
              </p>
            </div>

            {/* Requirements */}
            <div className="bg-secondary border border-border p-4 mb-8">
              <p className="font-sans text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  Requirements:
                </span>{" "}
                ChatGPT Pro, Plus, Business, Enterprise, or Education account.
                Enable developer mode in{" "}
                <span className="font-medium">
                  Settings → Apps → Advanced settings
                </span>
                .
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
                  onClick={() => setActiveTab("developer")}
                  className={`px-4 py-2 text-sm font-sans transition-colors relative ${
                    activeTab === "developer"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Developer Mode
                  {activeTab === "developer" && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground -mb-[1px]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("sdk")}
                  className={`px-4 py-2 text-sm font-sans transition-colors relative ${
                    activeTab === "sdk"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  SDK
                  {activeTab === "sdk" && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground -mb-[1px]" />
                  )}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "developer" && (
              <div className="space-y-4">
                <p className="font-sans text-sm text-muted-foreground">
                  Create an MCP app in ChatGPT with this configuration:
                </p>
                <CodeBlock code={developerConfig} />
                <p className="font-sans text-xs text-muted-foreground">
                  Uses{" "}
                  <a
                    href="https://www.npmjs.com/package/mcp-remote"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    mcp-remote
                  </a>{" "}
                  to bridge bearer token authentication (installed automatically
                  via npx).
                </p>
              </div>
            )}

            {activeTab === "sdk" && (
              <div className="space-y-4">
                <p className="font-sans text-sm text-muted-foreground">
                  Build custom integrations with the MCP SDK:
                </p>
                <CodeBlock code={installCode} />
                <div className="mt-4">
                  <CodeBlock code={sdkCode} />
                </div>
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
                    {activeTab === "developer"
                      ? "Enable developer mode in Settings → Apps → Advanced settings"
                      : "Install the MCP SDK with npm"}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-secondary border border-border flex items-center justify-center font-mono text-xs text-muted-foreground">
                    3
                  </span>
                  <span className="font-sans text-sm text-muted-foreground pt-0.5">
                    {activeTab === "developer"
                      ? "Create a new MCP app with the config above"
                      : "Use the code example to connect and call tools"}
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
