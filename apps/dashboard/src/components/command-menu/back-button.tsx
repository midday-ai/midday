"use client";

import { MenuOption, useCommandStore } from "@/store/command";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";

export function BackButton() {
  const { setMenu } = useCommandStore();

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="items-center rounded border bg-accent p-1"
            onClick={() => setMenu(MenuOption.Root)}
          >
            <Icons.ArrowBack />
          </button>
        </TooltipTrigger>
        <TooltipContent
          sideOffset={-5}
          className="text-xs p-0 flex items-center py-1 h-7 px-2 invisible todesktop:visible"
          side="left"
        >
          <div className="flex items-center space-x-1 mr-2">
            <kbd className="rounded border bg-accent px-1.5 font-mono">
              <span className="text-[9px]">ctrl</span>
            </kbd>
            <kbd className="rounded border bg-accent px-1.5 font-mono text-[12px]">
              <span>⌫</span>
            </kbd>
          </div>

          <span>to go back</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
