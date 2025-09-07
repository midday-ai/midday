import type { ToolName } from "@api/ai/tools/registry";
import { type IconType, Icons } from "@midday/ui/icons";
import { TextShimmer } from "@midday/ui/text-shimmer";
import React from "react";

export const ThinkingMessage = () => {
  return (
    <TextShimmer className="text-sm" duration={1}>
      Thinking...
    </TextShimmer>
  );
};

type ActiveToolCallProps = {
  toolName: ToolName | "web_search_preview";
};

export const ActiveToolCall = ({ toolName }: ActiveToolCallProps) => {
  let icon: IconType | null = null;
  let text = "";

  switch (toolName) {
    case "getRevenue":
      icon = Icons.AIOutline;
      text = "Getting revenue data";
      break;
    case "web_search_preview":
      icon = Icons.Search;
      text = "Searching the web";
      break;
    default:
      icon = Icons.AIOutline;
      text = `Running ${toolName}`;
      break;
  }

  return (
    <div className="flex justify-start mt-3 animate-fade-in">
      <div className="dark:bg-[#0c0c0c] bg-[#F7F7F7] border dark:border-[#1d1d1d] border-[#E5E7EB] px-2 py-1 flex items-center gap-2 h-6 w-fit">
        <span className="material-icons-outlined font-light text-[#666666] text-xs">
          {icon && React.createElement(icon, { className: "size-4" })}
        </span>
        <TextShimmer className="text-xs" duration={1}>
          {text}
        </TextShimmer>
      </div>
    </div>
  );
};
