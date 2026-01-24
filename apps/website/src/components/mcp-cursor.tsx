"use client";

import { CursorMcpLogo } from "@midday/app-store/logos";
import { Icons } from "@midday/ui/icons";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";

function CodeBlock({
  code,
  language = "json",
}: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="relative group">
      <div className="bg-secondary border border-border rounded-none overflow-hidden">
        <SyntaxHighlighter
          language={language}
          style={isDark ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            padding: "1rem",
            fontSize: "0.875rem",
            background: "transparent",
            fontFamily:
              "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
          }}
          codeTagProps={{
            className: "font-mono",
          }}
          PreTag="div"
        >
          {code}
        </SyntaxHighlighter>
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

// Pre-computed deeplink with placeholder token
const cursorConfig = {
  url: "https://api.midday.ai/mcp",
  headers: {
    Authorization: "Bearer YOUR_API_KEY",
  },
};
const cursorDeepLink = `cursor://anysphere.cursor-deeplink/mcp/install?name=midday&config=${encodeURIComponent(btoa(JSON.stringify(cursorConfig)))}`;

const manualConfig = JSON.stringify(
  {
    mcpServers: {
      midday: {
        url: "https://api.midday.ai/mcp",
        headers: {
          Authorization: "Bearer YOUR_API_KEY",
        },
      },
    },
  },
  null,
  2,
);

export function MCPCursor() {
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
                <CursorMcpLogo />
              </div>
              <div>
                <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider">
                  MCP Server
                </p>
                <h1 className="font-serif text-3xl sm:text-4xl text-foreground">
                  Cursor
                </h1>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4 mb-8">
              <h2 className="font-serif text-xl sm:text-2xl text-foreground">
                Financial context in your editor
              </h2>
              <p className="font-sans text-base text-muted-foreground leading-relaxed">
                Cursor can access your transactions, invoices, and reports while
                you work. Ask questions about your finances without leaving your
                code.
              </p>
            </div>

            {/* Install Button */}
            <div className="space-y-4 mb-12">
              <a href={cursorDeepLink} className="inline-block">
                <img
                  src="https://cursor.com/deeplink/mcp-install-dark.png"
                  alt="Add Midday MCP server to Cursor"
                  height={32}
                  className="h-8 dark:hidden"
                />
                <img
                  src="https://cursor.com/deeplink/mcp-install-light.png"
                  alt="Add Midday MCP server to Cursor"
                  height={32}
                  className="h-8 hidden dark:block"
                />
              </a>
              <p className="font-sans text-xs text-muted-foreground">
                After installing, update{" "}
                <code className="font-mono">YOUR_API_KEY</code> in{" "}
                <code className="font-mono">~/.cursor/mcp.json</code> with your{" "}
                <Link
                  href="https://app.abacuslabs.co/settings/developer"
                  className="underline hover:text-foreground"
                >
                  API key
                </Link>
                .
              </p>
            </div>

            {/* Divider */}
            <div className="h-px w-full border-t border-border mb-8" />

            {/* Manual Setup */}
            <div className="space-y-4">
              <h3 className="font-sans text-sm font-medium text-foreground">
                Manual setup
              </h3>
              <p className="font-sans text-sm text-muted-foreground">
                Add to <code className="font-mono">~/.cursor/mcp.json</code>:
              </p>
              <CodeBlock code={manualConfig} language="json" />
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
                    Click "Add to Cursor" above
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-secondary border border-border flex items-center justify-center font-mono text-xs text-muted-foreground">
                    2
                  </span>
                  <span className="font-sans text-sm text-muted-foreground pt-0.5">
                    Get an API key from{" "}
                    <Link
                      href="https://app.abacuslabs.co/settings/developer"
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
                    Replace <code className="font-mono">YOUR_API_KEY</code> in{" "}
                    <code className="font-mono">~/.cursor/mcp.json</code>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-secondary border border-border flex items-center justify-center font-mono text-xs text-muted-foreground">
                    4
                  </span>
                  <span className="font-sans text-sm text-muted-foreground pt-0.5">
                    Restart Cursor and @-mention Midday in chat
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
