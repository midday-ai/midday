"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Icons } from "@midday/ui/icons";
import { Spinner } from "@midday/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";

type Props = {
  item: RouterOutputs["inbox"]["get"]["data"][number];
};

export function InboxStatus({ item }: Props) {
  // Don't show status for processing items - let skeleton handle the visual feedback
  if (item.status === "processing" || item.status === "new") {
    return null;
  }

  // Show status for "other" (non-financial) documents
  if (item.status === "other" || item.type === "other") {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex space-x-1.5 items-center px-1.5 py-0.5 text-[10px] cursor-default border text-muted-foreground">
              <span>Document</span>
            </div>
          </TooltipTrigger>
          <TooltipContent sideOffset={10} className="text-xs">
            <p>
              This document isn't an invoice or receipt — <br />
              no transaction matching required
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (item.status === "analyzing") {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex space-x-1 items-center p-1 text-[#878787] text-[10px] px-1.5 py-0.5 cursor-default border">
              <Spinner size={14} className="stroke-primary" />
              <span>Analyzing</span>
            </div>
          </TooltipTrigger>
          <TooltipContent sideOffset={10} className="text-xs">
            <p>
              We're reviewing the file and checking <br />
              for a matching transaction
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (item.status === "suggested_match") {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex space-x-1.5 items-center px-1.5 py-0.5 text-[10px] cursor-default border">
              <div className="w-1.5 h-1.5 bg-[#FFD02B] rounded-full" />
              <span>Suggested match</span>
            </div>
          </TooltipTrigger>
          <TooltipContent sideOffset={10} className="text-xs">
            <p>
              We found a possible match — confirm <br />
              or dismiss it
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (item.status === "pending") {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="p-1 text-[10px] px-1.5 py-0.5 cursor-default inline-block border">
              <span>Pending</span>
            </div>
          </TooltipTrigger>
          <TooltipContent sideOffset={10} className="text-xs">
            <p>
              We didn't find a match yet — we'll check <br />
              again when new transactions arrive
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (item.status === "done" || item?.transactionId) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex space-x-1 items-center px-1.5 py-0.5 text-[10px] cursor-default border">
              <Icons.Check className="size-3.5 mt-[1px]" />
              <span>Matched</span>
            </div>
          </TooltipTrigger>
          <TooltipContent sideOffset={10} className="text-xs">
            <p>
              This file has been successfully <br />
              matched to a transaction
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
          <div className="flex space-x-1 items-center px-1.5 py-0.5 text-[10px] cursor-default border">
            <span>No match</span>
          </div>
        </TooltipTrigger>
        <TooltipContent sideOffset={10} className="text-xs">
          <p>
            We couldn't find a match — please <br />
            select the transaction manually
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
