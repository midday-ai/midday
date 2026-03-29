"use client";

import { InvoiceTemplate } from "@midday/mcp-apps/invoice";
import { Icons } from "@midday/ui/icons";
import { TextShimmer } from "@midday/ui/text-shimmer";
import type { UIMessage } from "ai";
import Link from "next/link";
import type { ReactNode } from "react";
import { Streamdown } from "streamdown";

type ChatMessagesProps = {
  messages: UIMessage[];
  status: string;
};

const INVOICE_TOOLS = new Set([
  "invoices_get",
  "invoices_create",
  "invoices_update_draft",
  "invoices_create_from_tracker",
]);

const HIDDEN_TOOLS = new Set(["toolSearch"]);

const TOOL_LABELS: Record<string, string> = {
  transactions_list: "Looking up transactions",
  transactions_get: "Fetching transaction details",
  transactions_create: "Creating transaction",
  transactions_update: "Updating transaction",
  invoices_list: "Looking up invoices",
  invoices_get: "Fetching invoice",
  invoices_create: "Creating invoice",
  invoices_update_draft: "Updating invoice",
  invoices_create_from_tracker: "Creating invoice from time entries",
  bank_accounts_list: "Checking bank accounts",
  bank_accounts_get: "Fetching account details",
  reports_profit_loss: "Generating profit & loss report",
  reports_revenue: "Calculating revenue",
  reports_burn_rate: "Calculating burn rate",
  reports_expense: "Analyzing expenses",
  tracker_entries_list: "Looking up time entries",
  tracker_projects_list: "Looking up projects",
  inbox_list: "Checking inbox",
  categories_list: "Fetching categories",
  search_global: "Searching",
};

function formatToolName(name: string): string {
  if (TOOL_LABELS[name]) return TOOL_LABELS[name];
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type DynamicToolPart = {
  type: "dynamic-tool";
  toolName: string;
  state: string;
  toolCallId: string;
  output?: unknown;
};

function extractInvoiceData(output: unknown): Record<string, unknown> | null {
  if (!output || typeof output !== "object") return null;
  const result = output as Record<string, unknown>;
  const structured = result.structuredContent as
    | Record<string, unknown>
    | undefined;
  if (structured?.invoice) return structured.invoice as Record<string, unknown>;
  if (structured?.data) return structured.data as Record<string, unknown>;
  return null;
}

const TOOL_ICON_MAP: Record<string, (s: number) => ReactNode> = {
  transactions: (s) => <Icons.Transactions size={s} />,
  invoices: (s) => <Icons.Invoice size={s} />,
  invoice_products: (s) => <Icons.Invoice size={s} />,
  invoice_template: (s) => <Icons.Invoice size={s} />,
  invoice_recurring: (s) => <Icons.Invoice size={s} />,
  customers: (s) => <Icons.Customers size={s} />,
  bank_accounts: (s) => <Icons.Accounts size={s} />,
  reports: (s) => <Icons.Leaderboard size={s} />,
  tracker: (s) => <Icons.Tracker size={s} />,
  categories: (s) => <Icons.Category size={s} />,
  tags: (s) => <Icons.Status size={s} />,
  inbox: (s) => <Icons.Inbox2 size={s} />,
  documents: (s) => <Icons.Description size={s} />,
  search: (s) => <Icons.Search size={s} />,
  team: (s) => <Icons.Face size={s} />,
};

function getToolIcon(toolName: string, size: number): ReactNode {
  const prefix = Object.keys(TOOL_ICON_MAP).find((k) => toolName.startsWith(k));
  return prefix ? (
    (TOOL_ICON_MAP[prefix]?.(size) ?? <Icons.AI size={size} />)
  ) : (
    <Icons.AI size={size} />
  );
}

function ToolCallGroup({ parts }: { parts: DynamicToolPart[] }) {
  const visible = parts.filter((p) => !HIDDEN_TOOLS.has(p.toolName));
  if (visible.length === 0) return null;

  const allDone = visible.every(
    (p) => p.state === "output-available" || p.state === "output-error",
  );

  if (allDone) {
    const count = visible.length;
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
        <Icons.Check size={14} />
        {count === 1
          ? formatToolName(visible[0]!.toolName)
          : `Used ${count} tools`}
      </span>
    );
  }

  const active = [...visible]
    .reverse()
    .find((p) => p.state !== "output-available" && p.state !== "output-error");

  if (!active) return null;

  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span className="shrink-0 text-muted-foreground/50">
        {getToolIcon(active.toolName, 14)}
      </span>
      <TextShimmer className="text-xs font-normal" duration={0.75}>
        {formatToolName(active.toolName)}
      </TextShimmer>
    </span>
  );
}

function InvoicePreview({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="mt-3">
      <InvoiceTemplate data={data} />
    </div>
  );
}

function shouldShowThinking(messages: UIMessage[]): boolean {
  const last = messages[messages.length - 1];
  if (!last) return false;

  if (last.role === "user") return true;

  if (last.role === "assistant") {
    const hasText = last.parts.some(
      (p) => p.type === "text" && p.text.length > 0,
    );
    if (hasText) return false;

    const toolParts = last.parts.filter(
      (p) => p.type === "dynamic-tool",
    ) as DynamicToolPart[];

    const hasActiveTool = toolParts.some(
      (p) =>
        !HIDDEN_TOOLS.has(p.toolName) &&
        p.state !== "output-available" &&
        p.state !== "output-error",
    );
    if (hasActiveTool) return false;

    return true;
  }

  return false;
}

export function ChatMessages({ messages, status }: ChatMessagesProps) {
  if (messages.length === 0) return null;

  const isStreaming = status === "streaming" || status === "submitted";

  return (
    <div className="space-y-4 mb-4">
      {messages.map((message) => {
        if (message.role === "user") {
          return (
            <div key={message.id} className="flex justify-end">
              <div className="max-w-[85%] text-sm bg-secondary px-4 py-2 rounded-2xl rounded-br-none">
                <span>
                  {message.parts
                    .filter((p) => p.type === "text")
                    .map((p) => p.text)
                    .join("")}
                </span>
              </div>
            </div>
          );
        }

        const textContent = message.parts
          .filter((p) => p.type === "text")
          .map((p) => p.text)
          .join("");

        const toolParts = message.parts.filter(
          (p) => p.type === "dynamic-tool",
        ) as DynamicToolPart[];

        const invoiceParts = toolParts.filter(
          (p) =>
            INVOICE_TOOLS.has(p.toolName) &&
            p.state === "output-available" &&
            p.output,
        );

        const hasInvoice = invoiceParts.length > 0;

        return (
          <div key={message.id} className="flex justify-start">
            <div
              className={
                hasInvoice
                  ? "w-full text-sm text-muted-foreground"
                  : "max-w-[85%] text-sm text-muted-foreground"
              }
            >
              {toolParts.length > 0 && (
                <div className="mb-4">
                  <ToolCallGroup parts={toolParts} />
                </div>
              )}

              {textContent && (
                <Streamdown
                  isAnimating={
                    isStreaming &&
                    message.id === messages[messages.length - 1]?.id
                  }
                  className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 space-y-3"
                  components={{
                    a: ({ href, children }) => (
                      <Link
                        href={href || "#"}
                        className="border-b border-dashed border-[#878787]/30 hover:text-foreground transition-colors"
                      >
                        {children}
                      </Link>
                    ),
                    p: ({ children }) => (
                      <p className="leading-relaxed">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="space-y-1 pl-4">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="space-y-1 pl-4 list-decimal">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="leading-relaxed list-disc marker:text-muted-foreground/40">
                        {children}
                      </li>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-sm font-medium text-foreground mt-4 mb-1">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-sm font-medium text-foreground mt-3 mb-1">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm font-medium text-foreground mt-2 mb-1">
                        {children}
                      </h3>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-medium text-foreground">
                        {children}
                      </strong>
                    ),
                    code: ({ children }) => (
                      <code className="px-1 py-0.5 bg-secondary text-foreground text-xs font-mono">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="p-3 bg-secondary text-foreground text-xs font-mono overflow-x-auto">
                        {children}
                      </pre>
                    ),
                    table: ({ children }) => (
                      <div className="w-full overflow-x-auto my-3">
                        <table className="w-full caption-bottom text-sm">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="[&_tr]:border-b border">
                        {children}
                      </thead>
                    ),
                    tbody: ({ children }) => (
                      <tbody className="[&_tr:last-child]:border-0 border">
                        {children}
                      </tbody>
                    ),
                    tr: ({ children }) => (
                      <tr className="border-b">{children}</tr>
                    ),
                    th: ({ children }) => (
                      <th className="h-10 px-4 text-left align-middle text-[#666666] font-medium border-r last:border-r-0">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-4 py-2 align-middle border-r last:border-r-0">
                        {children}
                      </td>
                    ),
                  }}
                >
                  {textContent}
                </Streamdown>
              )}

              {invoiceParts.map((part) => {
                const invoiceData = extractInvoiceData(part.output);
                if (!invoiceData) return null;
                return (
                  <InvoicePreview key={part.toolCallId} data={invoiceData} />
                );
              })}
            </div>
          </div>
        );
      })}

      {isStreaming && shouldShowThinking(messages) && (
        <div className="flex items-center h-6">
          <TextShimmer className="text-xs font-normal" duration={0.75}>
            Thinking...
          </TextShimmer>
        </div>
      )}
    </div>
  );
}
