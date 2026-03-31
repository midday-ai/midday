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
  formatToolName,
  HIDDEN_TOOLS,
  ICON_SIZE,
  type NormalizedToolPart,
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
  COMPOSIO: (s) => <Icons.AddLink size={s} className="-rotate-45" />,
};

function getToolIcon(toolName: string, size: number): ReactNode {
  const prefix = Object.keys(TOOL_ICON_MAP).find((k) => toolName.startsWith(k));
  return TOOL_ICON_MAP[prefix!]?.(size) ?? <Icons.AI size={size} />;
}

const boxClassName =
  "inline-flex items-center gap-1.5 border bg-white border-[#e6e6e6] dark:border-[#1d1d1d] dark:bg-[#0c0c0c] px-2 py-1 text-[11px] leading-none text-muted-foreground/60";

const iconClassName = "text-muted-foreground/40";

export function ToolCallGroup({ parts }: { parts: NormalizedToolPart[] }) {
  const [open, setOpen] = useState(false);
  const visible = parts.filter((p) => !HIDDEN_TOOLS.has(p.toolName));
  if (visible.length === 0) return null;

  const allDone = visible.every(
    (p) => p.state === "output-available" || p.state === "output-error",
  );

  if (allDone) {
    if (visible.length === 1) {
      return (
        <div className={boxClassName}>
          <span className={cn("shrink-0 text-muted-foreground/40")}>
            <Icons.Check size={ICON_SIZE} />
          </span>
          <span>{formatToolName(visible[0]!.toolName)}</span>
        </div>
      );
    }

    return (
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="inline-flex flex-col border bg-white border-[#e6e6e6] dark:border-[#1d1d1d] dark:bg-[#0c0c0c] overflow-hidden">
          <CollapsibleTrigger className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] leading-none text-muted-foreground/60 cursor-pointer hover:bg-[#f7f7f7] dark:hover:bg-[#0f0f0f] hover:text-foreground transition-all duration-300">
            <Icons.Check
              size={ICON_SIZE}
              className={cn(iconClassName, open && "hidden")}
            />
            <Icons.ChevronRight
              size={ICON_SIZE}
              className={cn(
                iconClassName,
                "transition-transform duration-150",
                !open && "hidden",
                open && "rotate-90",
              )}
            />
            <span>Used {visible.length} tools</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {visible.map((p) => (
              <div
                key={p.toolCallId}
                className="flex items-center gap-1.5 px-2 py-1 text-[11px] leading-none text-muted-foreground/60 border-t border-[#e6e6e6] dark:border-[#1d1d1d]"
              >
                <span className={cn("shrink-0", iconClassName)}>
                  {getToolIcon(p.toolName, ICON_SIZE)}
                </span>
                <span>{formatToolName(p.toolName)}</span>
              </div>
            ))}
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  }

  const active = [...visible]
    .reverse()
    .find((p) => p.state !== "output-available" && p.state !== "output-error");

  if (!active) return null;

  return (
    <div className={boxClassName}>
      <span className={cn("shrink-0", iconClassName)}>
        {getToolIcon(active.toolName, ICON_SIZE)}
      </span>
      <TextShimmer
        className="text-[11px] leading-tight font-normal"
        duration={0.75}
      >
        {formatToolName(active.toolName)}
      </TextShimmer>
    </div>
  );
}
