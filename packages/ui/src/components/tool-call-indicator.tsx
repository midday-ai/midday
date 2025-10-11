"use client";

import { cn } from "../utils";
import { Icons } from "./icons";
import { TextShimmer } from "./text-shimmer";

export const toolDisplayConfig = {
  getBurnRate: {
    displayText: "Getting Burn Rate Data",
    icon: Icons.TrendingUp,
  },
  web_search: {
    displayText: "Searching the Web",
    icon: Icons.Search,
  },
} as const;

export type SupportedToolName = keyof typeof toolDisplayConfig;

export interface ToolCallIndicatorProps {
  toolName: SupportedToolName;
  className?: string;
}

export function ToolCallIndicator({
  toolName,
  className,
}: ToolCallIndicatorProps) {
  const config = toolDisplayConfig[toolName];

  if (!config) {
    return null;
  }

  return (
    <div className={cn("flex justify-start mt-3 animate-fade-in", className)}>
      <div className="border px-3 py-1 flex items-center gap-2 w-fit">
        <div className="flex items-center justify-center size-3.5">
          <config.icon size={14} />
        </div>
        <TextShimmer className="text-xs text-[#707070]" duration={1}>
          {config.displayText}
        </TextShimmer>
      </div>
    </div>
  );
}
