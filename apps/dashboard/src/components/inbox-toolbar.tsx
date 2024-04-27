"use client";

import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { useHotkeys } from "react-hotkeys-hook";

type Props = {
  isFirst: boolean;
  isLast: boolean;
};

export function InboxToolbar({ isFirst, isLast }: Props) {
  return (
    <div className="left-0 right-0 absolute bottom-0 flex items-center justify-center">
      <div className="backdrop-filter backdrop-blur-lg dark:bg-[#1A1A1A]/80 bg-[#F6F6F3]/80 h-12 justify-between items-center flex px-4 rounded-lg space-x-4 text-[#878787]">
        <button type="button" className="flex items-center space-x-2">
          <kbd className="pointer-events-none h-6 select-none items-center gap-1 rounded border bg-accent px-1.5 font-mono text-xs font-medium flex bg-[#2C2C2C]">
            <span className="text-[16px]">⌘</span>
            <Icons.Backspace />
          </kbd>
          <span className="text-sm">Delete</span>
        </button>
        <button
          type="button"
          className={cn("flex items-center space-x-2", isFirst && "opacity-40")}
        >
          <kbd className="pointer-events-none h-6 select-none items-center gap-1 rounded border bg-accent px-1 font-mono text-xs font-medium flex bg-[#2C2C2C]">
            <Icons.ArrowDropUp size={16} />
          </kbd>
          <span className="text-sm">Previous</span>
        </button>
        <button
          type="button"
          className={cn("flex items-center space-x-2", isLast && "opacity-40")}
        >
          <kbd className="pointer-events-none h-6 select-none items-center gap-1 rounded border bg-accent px-1 font-mono text-xs font-medium flex bg-[#2C2C2C]">
            <Icons.ArrowDropDown size={16} />
          </kbd>
          <span className="text-sm">Next</span>
        </button>
      </div>
    </div>
  );
}
