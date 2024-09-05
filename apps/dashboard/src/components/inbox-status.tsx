"use client";

import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";

export function InboxStatus({ item }) {
  if (item.status === "processing" || item.status === "new") {
    return (
      <div className="flex space-x-1 items-center py-1 px-2 h-[26px]">
        <span className="text-xs">Processing</span>
      </div>
    );
  }

  if (item?.transaction_id) {
    return (
      <div className="flex space-x-1 items-center py-1 px-2 h-[26px]">
        <Icons.Check />
        <span className="text-xs">Done</span>
      </div>
    );
  }

  if (item.pending || item.status === "pending") {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="p-1 text-[#878787] bg-[#F2F1EF] text-[11px] dark:bg-[#1D1D1D] px-3 py-1 rounded-full cursor-default font-mono inline-block">
              <span>Pending</span>
            </div>
          </TooltipTrigger>
          <TooltipContent sideOffset={20} className="text-xs">
            <p>
              We will try to match against incoming <br />
              transactions for up to 45 days
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex space-x-1 items-center">
            <Icons.Error />
            <span>Needs review</span>
          </div>
        </TooltipTrigger>
        <TooltipContent sideOffset={20} className="text-xs">
          <p>
            We could not find a matching transaction
            <br />
            please select the transaction manually
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
