import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";

type Props = {
  fullfilled: boolean;
};

export function TransactionStatus({ fullfilled }: Props) {
  if (fullfilled) {
    return (
      <div className="flex justify-end">
        <Icons.Check />
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <TooltipProvider delayDuration={50}>
        <Tooltip>
          <TooltipTrigger>
            <Icons.AlertCircle />
          </TooltipTrigger>
          <TooltipContent
            className="px-3 py-1.5 text-xs"
            side="left"
            sideOffset={10}
          >
            Missing receipt
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
