"use client";

import { Icons } from "@midday/ui/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { useState } from "react";

function CopyableUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-2 w-full bg-secondary border border-border px-3 py-2.5 text-left group hover:border-foreground/30 transition-colors"
    >
      <span className="font-mono text-xs flex-1 truncate">{url}</span>
      {copied ? (
        <Icons.Check className="text-foreground flex-shrink-0" size={14} />
      ) : (
        <Icons.Copy
          className="text-muted-foreground group-hover:text-foreground flex-shrink-0 transition-colors"
          size={14}
        />
      )}
    </button>
  );
}

function CopyableCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="bg-secondary border border-border overflow-hidden">
        <pre className="overflow-x-auto p-3 text-xs font-mono">
          <code>{code}</code>
        </pre>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1 bg-background/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground hover:bg-background transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Copy code"
      >
        {copied ? (
          <Icons.Check size={12} className="text-foreground" />
        ) : (
          <Icons.Copy size={12} />
        )}
      </button>
    </div>
  );
}

function SetupStep({
  number,
  children,
}: {
  number: number;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="flex-shrink-0 w-5 h-5 bg-secondary border border-border flex items-center justify-center font-mono text-[10px] text-muted-foreground">
        {number}
      </span>
      <span className="text-xs text-[#878787] pt-0.5">{children}</span>
    </li>
  );
}

export function ChatGPTSetupInstructions() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-[#878787]">
        Connect ChatGPT to your Midday account via MCP. No API key needed —
        authentication is handled automatically via OAuth.
      </p>

      <div className="space-y-2">
        <p className="text-xs text-[#878787]">
          Copy this URL and add it as a connector in ChatGPT:
        </p>
        <CopyableUrl url="https://api.midday.ai/mcp" />
      </div>

      <div className="space-y-2.5">
        <p className="text-xs font-medium text-primary">Setup steps</p>
        <ol className="space-y-2.5">
          <SetupStep number={1}>
            In ChatGPT, go to{" "}
            <span className="font-medium text-primary">
              Settings → Connectors
            </span>{" "}
            and click <span className="font-medium text-primary">Create</span>
          </SetupStep>
          <SetupStep number={2}>
            Paste the URL above as the connector URL
          </SetupStep>
          <SetupStep number={3}>
            When you use a Midday tool, you'll be prompted to sign in and select
            a team
          </SetupStep>
        </ol>
      </div>

      <div className="bg-secondary border border-border p-3">
        <p className="text-[11px] text-[#878787]">
          <span className="font-medium text-primary">Requirements:</span>{" "}
          ChatGPT Pro, Plus, Business, Enterprise, or Education account. Enable
          developer mode in Settings → Apps & Connectors → Advanced settings.
        </p>
      </div>
    </div>
  );
}

export function GeminiSetupInstructions() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-[#878787]">
        Connect Gemini CLI to your Midday account via MCP. No API key needed —
        authentication is handled automatically via OAuth.
      </p>

      <div className="space-y-2">
        <p className="text-xs text-[#878787]">
          Run this command to add the Midday MCP server:
        </p>
        <CopyableCode code="gemini mcp add --transport http midday https://api.midday.ai/mcp" />
      </div>

      <div className="space-y-2.5">
        <p className="text-xs font-medium text-primary">Setup steps</p>
        <ol className="space-y-2.5">
          <SetupStep number={1}>
            Run the command above in your terminal
          </SetupStep>
          <SetupStep number={2}>
            When prompted, sign in to Midday in your browser and select a team
          </SetupStep>
          <SetupStep number={3}>
            Use Midday tools in Gemini CLI to access your financial data
          </SetupStep>
        </ol>
      </div>

      <div className="bg-secondary border border-border p-3">
        <p className="text-[11px] text-[#878787]">
          <span className="font-medium text-primary">Requirements:</span> Gemini
          CLI installed. See the{" "}
          <a
            href="https://github.com/google-gemini/gemini-cli"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            Gemini CLI docs
          </a>{" "}
          for installation instructions.
        </p>
      </div>
    </div>
  );
}

export function WindsurfSetupInstructions() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-[#878787]">
        Connect Windsurf to your Midday account via MCP. No API key needed —
        authentication is handled automatically via OAuth.
      </p>

      <div className="space-y-2.5">
        <p className="text-xs font-medium text-primary">Setup steps</p>
        <ol className="space-y-2.5">
          <SetupStep number={1}>
            Open Windsurf and go to{" "}
            <span className="font-medium text-primary">
              Settings → MCP Marketplace
            </span>{" "}
            (or edit{" "}
            <span className="font-mono text-primary">mcp_config.json</span>)
          </SetupStep>
          <SetupStep number={2}>
            Add a new server with URL:
            <CopyableUrl url="https://api.midday.ai/mcp" />
          </SetupStep>
          <SetupStep number={3}>
            When prompted, sign in to Midday in your browser and select a team
          </SetupStep>
        </ol>
      </div>
    </div>
  );
}

export function ClineSetupInstructions() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-[#878787]">
        Connect Cline to your Midday account via MCP. No API key needed —
        authentication is handled automatically via OAuth.
      </p>

      <div className="space-y-2.5">
        <p className="text-xs font-medium text-primary">Setup steps</p>
        <ol className="space-y-2.5">
          <SetupStep number={1}>
            In the Cline sidebar, go to the{" "}
            <span className="font-medium text-primary">Remote Servers</span> tab
          </SetupStep>
          <SetupStep number={2}>
            Add the server URL:
            <CopyableUrl url="https://api.midday.ai/mcp" />
          </SetupStep>
          <SetupStep number={3}>
            Click <span className="font-medium text-primary">Authenticate</span>{" "}
            and sign in to Midday in your browser
          </SetupStep>
        </ol>
      </div>

      <div className="bg-secondary border border-border p-3">
        <p className="text-[11px] text-[#878787]">
          <span className="font-medium text-primary">Requirements:</span> VS
          Code with the Cline extension installed.
        </p>
      </div>
    </div>
  );
}

export function ZedSetupInstructions() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-[#878787]">
        Connect Zed to your Midday account via MCP. No API key needed —
        authentication is handled automatically via OAuth.
      </p>

      <div className="space-y-2.5">
        <p className="text-xs font-medium text-primary">Setup steps</p>
        <ol className="space-y-2.5">
          <SetupStep number={1}>
            Open the{" "}
            <span className="font-medium text-primary">
              Agent Panel settings
            </span>{" "}
            and click{" "}
            <span className="font-medium text-primary">Add Custom Server</span>
          </SetupStep>
          <SetupStep number={2}>
            Enter the URL:
            <CopyableUrl url="https://api.midday.ai/mcp" />
          </SetupStep>
          <SetupStep number={3}>
            When prompted, sign in to Midday in your browser and select a team
          </SetupStep>
        </ol>
      </div>

      <div className="bg-secondary border border-border p-3">
        <p className="text-[11px] text-[#878787]">
          <span className="font-medium text-primary">Requirements:</span> Zed
          editor installed.
        </p>
      </div>
    </div>
  );
}

export function ManusSetupInstructions() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-[#878787]">
        Connect Manus to your Midday account via MCP.
      </p>

      <div className="space-y-2.5">
        <p className="text-xs font-medium text-primary">Setup steps</p>
        <ol className="space-y-2.5">
          <SetupStep number={1}>
            In Manus, go to{" "}
            <span className="font-medium text-primary">Settings</span> and add a
            new MCP connector
          </SetupStep>
          <SetupStep number={2}>
            Enter the server URL:
            <CopyableUrl url="https://api.midday.ai/mcp" />
          </SetupStep>
          <SetupStep number={3}>
            Authenticate with your Midday account when prompted
          </SetupStep>
        </ol>
      </div>

      <div className="bg-secondary border border-border p-3">
        <p className="text-[11px] text-[#878787]">
          <span className="font-medium text-primary">Requirements:</span> Manus
          account with MCP connector support.
        </p>
      </div>
    </div>
  );
}

export function ClaudeSetupInstructions() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-[#878787]">
        Connect Claude to your Midday account via MCP. No API key needed —
        authentication is handled automatically via OAuth.
      </p>

      <Tabs defaultValue="connect" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="connect" className="flex-1 text-xs">
            Claude.ai / Desktop
          </TabsTrigger>
          <TabsTrigger value="code" className="flex-1 text-xs">
            Claude Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connect" className="space-y-4 mt-3">
          <div className="space-y-2">
            <p className="text-xs text-[#878787]">
              Copy this URL and add it as a connector in Claude:
            </p>
            <CopyableUrl url="https://api.midday.ai/mcp" />
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-medium text-primary">Setup steps</p>
            <ol className="space-y-2.5">
              <SetupStep number={1}>
                Go to{" "}
                <span className="font-medium text-primary">
                  Settings → Connectors
                </span>{" "}
                and click{" "}
                <span className="font-medium text-primary">
                  Add custom connector
                </span>
              </SetupStep>
              <SetupStep number={2}>
                Paste the URL above as the server URL
              </SetupStep>
              <SetupStep number={3}>
                When you use a Midday tool, you'll be prompted to sign in and
                select a team
              </SetupStep>
            </ol>
          </div>
        </TabsContent>

        <TabsContent value="code" className="space-y-4 mt-3">
          <div className="space-y-2">
            <p className="text-xs text-[#878787]">
              Run this command to add the Midday MCP server. OAuth will be
              handled automatically in your browser:
            </p>
            <CopyableCode code="claude mcp add --transport http midday https://api.midday.ai/mcp" />
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-medium text-primary">Setup steps</p>
            <ol className="space-y-2.5">
              <SetupStep number={1}>
                Run the command above in your terminal
              </SetupStep>
              <SetupStep number={2}>
                When prompted, sign in to Midday in your browser and select a
                team
              </SetupStep>
              <SetupStep number={3}>
                Use <span className="font-mono">@midday</span> in Claude Code to
                access your financial data
              </SetupStep>
            </ol>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
