"use client";

import { ManusMcpLogo } from "@midday/app-store/logos";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";

export function MCPManus() {
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
                <ManusMcpLogo />
              </div>
              <div>
                <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider">
                  MCP Server
                </p>
                <h1 className="font-serif text-3xl sm:text-4xl text-foreground">
                  Manus
                </h1>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <h2 className="font-serif text-xl sm:text-2xl text-foreground">
                Financial data in Manus
              </h2>
              <p className="font-sans text-base text-muted-foreground leading-relaxed">
                Connect Midday to Manus and automate financial workflows with AI
                agents. Query transactions, create invoices, and generate
                reports using natural language.
              </p>
            </div>

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
                      In Manus, go to{" "}
                      <span className="font-medium text-foreground">
                        Settings
                      </span>{" "}
                      and add a new MCP connector
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-secondary border border-border flex items-center justify-center font-mono text-xs text-muted-foreground">
                      2
                    </span>
                    <span className="font-sans text-sm text-muted-foreground pt-0.5">
                      Enter the server URL:{" "}
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
                      Authenticate with your Midday account when prompted
                    </span>
                  </li>
                </ol>
              </div>

              <div className="bg-secondary border border-border p-4 mt-6">
                <p className="font-sans text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Requirements:
                  </span>{" "}
                  Manus account with MCP connector support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
