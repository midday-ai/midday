"use client";

import { cn } from "@midday/ui/cn";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@midday/ui/collapsible";
import { Icons } from "@midday/ui/icons";
import { TextShimmer } from "@midday/ui/text-shimmer";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  type DynamicToolPart,
  formatToolName,
  HIDDEN_TOOLS,
  ICON_SIZE,
  STATUS_ROW,
} from "./chat-utils";

const TOOL_ICON_MAP: Record<string, (s: number) => ReactNode> = {
  transactions: (s) => <Icons.Transactions size={s} />,
  invoices: (s) => <Icons.Invoice size={s} />,
  invoice_products: (s) => <Icons.Invoice size={s} />,
  invoice_template: (s) => <Icons.Invoice size={s} />,
  invoice_recurring: (s) => <Icons.Invoice size={s} />,
  customers: (s) => <Icons.Customers size={s} />,
  bank_accounts: (s) => <Icons.Accounts size={s} />,
  reports: (s) => <Icons.Monitoring size={s} />,
  tracker: (s) => <Icons.Tracker size={s} />,
  categories: (s) => <Icons.Category size={s} />,
  tags: (s) => <Icons.Status size={s} />,
  inbox: (s) => <Icons.Inbox2 size={s} />,
  documents: (s) => <Icons.Description size={s} />,
  search: (s) => <Icons.Search size={s} />,
  web_search: (s) => <Icons.Globle size={s} />,
  team: (s) => <Icons.Face size={s} />,
};

function getToolIcon(toolName: string, size: number): ReactNode {
  const prefix = Object.keys(TOOL_ICON_MAP).find((k) => toolName.startsWith(k));
  return TOOL_ICON_MAP[prefix!]?.(size) ?? <Icons.AI size={size} />;
}

export function ToolCallGroup({ parts }: { parts: DynamicToolPart[] }) {
  const [open, setOpen] = useState(false);
  const visible = parts.filter((p) => !HIDDEN_TOOLS.has(p.toolName));
  if (visible.length === 0) return null;

  const allDone = visible.every(
    (p) => p.state === "output-available" || p.state === "output-error",
  );

  if (allDone) {
    if (visible.length === 1) {
      return (
        <span className={cn(STATUS_ROW, "text-muted-foreground/50")}>
          <Icons.Check size={ICON_SIZE} />
          {formatToolName(visible[0]!.toolName)}
        </span>
      );
    }

    return (
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger
          className={cn(
            STATUS_ROW,
            "text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer",
          )}
        >
          <Icons.ChevronRight
            size={ICON_SIZE}
            className={cn(
              "transition-transform duration-150",
              open && "rotate-90",
            )}
          />
          Used {visible.length} tools
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-1.5 ml-0.5 flex flex-col gap-1">
            {visible.map((p) => (
              <span
                key={p.toolCallId}
                className={cn(STATUS_ROW, "text-muted-foreground/50")}
              >
                <span className="shrink-0">
                  {getToolIcon(p.toolName, ICON_SIZE)}
                </span>
                {formatToolName(p.toolName)}
              </span>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  const active = [...visible]
    .reverse()
    .find((p) => p.state !== "output-available" && p.state !== "output-error");

  if (!active) return null;

  return (
    <span className={STATUS_ROW}>
      <span className="shrink-0 text-muted-foreground/50">
        {getToolIcon(active.toolName, ICON_SIZE)}
      </span>
      <TextShimmer className="text-xs font-normal" duration={0.75}>
        {formatToolName(active.toolName)}
      </TextShimmer>
    </span>
  );
}
