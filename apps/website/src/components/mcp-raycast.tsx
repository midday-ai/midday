"use client";

import { RaycastMcpLogo } from "@midday/app-store/logos";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import { useState } from "react";
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

// Raycast config for deeplink
const raycastConfig = {
  name: "midday",
  type: "stdio",
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
    AUTH_HEADER: "Bearer YOUR_API_KEY",
  },
};
const raycastDeepLink = `raycast://mcp/install?${encodeURIComponent(JSON.stringify(raycastConfig))}`;

const manualConfig = JSON.stringify(raycastConfig, null, 2);

export function MCPRaycast() {
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
                <RaycastMcpLogo />
              </div>
              <div>
                <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider">
                  MCP Server
                </p>
                <h1 className="font-serif text-3xl sm:text-4xl text-foreground">
                  Raycast
                </h1>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4 mb-8">
              <h2 className="font-serif text-xl sm:text-2xl text-foreground">
                Financial tools at your fingertips
              </h2>
              <p className="font-sans text-base text-muted-foreground leading-relaxed">
                Access transactions, invoices, and reports directly from Raycast
                with a keyboard shortcut. Query your financial data without
                switching apps.
              </p>
            </div>

            {/* Install Button */}
            <div className="space-y-4 mb-12">
              <Button
                asChild
                className="w-full sm:w-auto h-11 px-6 text-sm font-sans"
              >
                <a href={raycastDeepLink}>Add to Raycast</a>
              </Button>
              <p className="font-sans text-xs text-muted-foreground">
                After installing, edit the server in Raycast's "Manage Servers"
                and replace <code className="font-mono">YOUR_API_KEY</code> in
                the environment variables with your{" "}
                <Link
                  href="https://app.midday.ai/settings/developer"
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
                Use Raycast's "Install Server" command with this configuration:
              </p>
              <CodeBlock code={manualConfig} />
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
                    Click "Add to Raycast" above
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
                    Open Raycast's "Manage Servers" and edit Midday to add your
                    API key
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-secondary border border-border flex items-center justify-center font-mono text-xs text-muted-foreground">
                    4
                  </span>
                  <span className="font-sans text-sm text-muted-foreground pt-0.5">
                    @-mention Midday in Raycast AI to query your data
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
