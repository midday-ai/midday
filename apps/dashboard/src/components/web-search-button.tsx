"use client";

import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { useChatStore } from "@/store/chat";

export function WebSearchButton() {
  const { isWebSearch, setIsWebSearch } = useChatStore();

  return (
    <button
      type="button"
      onClick={() => setIsWebSearch(!isWebSearch)}
      className={cn(
        "flex items-center h-6 cursor-pointer transition-colors duration-200",
        isWebSearch
          ? "bg-[rgba(0,0,0,0.05)] hover:bg-[rgba(0,0,0,0.08)] dark:bg-[rgba(255,255,255,0.05)] dark:hover:bg-[rgba(255,255,255,0.08)] rounded-full pr-2"
          : "hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)]",
      )}
    >
      <span className="w-6 h-6 flex items-center justify-center">
        <Icons.Globle
          size={16}
          className={cn(
            "transition-colors",
            isWebSearch
              ? "text-black dark:text-white"
              : "text-[#707070] hover:text-[#999999] dark:text-[#666666] dark:hover:text-[#999999]",
          )}
        />
      </span>
      <span
        className={cn(
          "overflow-hidden transition-all duration-200 text-[12px] leading-[14px] font-medium whitespace-nowrap text-black dark:text-white",
          isWebSearch
            ? "max-w-[100px] opacity-100 ml-0.5"
            : "max-w-0 opacity-0 ml-0",
        )}
      >
        Search
      </span>
    </button>
  );
}
