"use client";

import { formatDate } from "@/utils/format";
import { Badge } from "@midday/ui/badge";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { FormatAmount } from "../format-amount";

type Props = {
  date: string;
  name: string;
  dateFormat?: string | null;
  amount: number;
  currency: string;
  showBestMatch?: boolean;
  isAlreadyMatched?: boolean;
  matchedAttachmentFilename?: string;
};

export function TransactionMatchItem({
  date,
  name,
  dateFormat,
  amount,
  currency,
  showBestMatch = false,
  isAlreadyMatched = false,
  matchedAttachmentFilename,
}: Props) {
  const tooltipContent = matchedAttachmentFilename
    ? `Matched with "${matchedAttachmentFilename}"`
    : "Already matched";

  return (
    <div className="flex w-full items-center justify-between gap-2 text-sm">
      <div className="flex gap-2 items-center">
        <span className="truncate">{name}</span>
        <span className="text-muted-foreground">
          {formatDate(date, dateFormat, true)}
        </span>
        {isAlreadyMatched && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <Icons.Link className="size-3.5" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-xs px-3 py-1.5">
                {tooltipContent}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center gap-4">
        {showBestMatch && (
          <Badge variant="outline" className="px-2 py-0">
            Best Match
          </Badge>
        )}
        <FormatAmount amount={amount} currency={currency} />
      </div>
    </div>
  );
}
