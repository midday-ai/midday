import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";

type Props = {
  fullfilled: boolean;
  hasPendingSuggestion?: boolean;
};

export function TransactionStatus({ fullfilled, hasPendingSuggestion }: Props) {
  if (fullfilled) {
    return (
      <div className="flex justify-start z-50">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex space-x-1 items-center cursor-default">
                <Icons.Check className="size-4.5 mt-[1px]" />
                <span>Matched</span>
              </div>
            </TooltipTrigger>
            <TooltipContent sideOffset={10} className="text-xs">
              <p>
                This transaction has been successfully <br />
                matched to a receipt or invoice
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  if (hasPendingSuggestion) {
    return (
      <div className="flex justify-start z-50">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex space-x-1.5 items-center cursor-default">
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
      </div>
    );
  }

  return null;
}
