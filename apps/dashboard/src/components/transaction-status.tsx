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
        <Icons.Check />
      </div>
    );
  }

  if (hasPendingSuggestion) {
    return (
      <div className="flex justify-start z-50">
        <TooltipProvider delayDuration={50}>
          <Tooltip>
            <TooltipTrigger>
              <div className="w-1.5 h-1.5 bg-[#FFD02B] rounded-full mr-1" />
            </TooltipTrigger>
            <TooltipContent
              className="px-3 py-1.5 text-xs"
              side="right"
              sideOffset={10}
            >
              Suggested match available
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }
}
