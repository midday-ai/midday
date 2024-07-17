import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useEventDetails } from "@trigger.dev/react";

export function SyncTransactions({
  eventId,
  onClick,
  isLoading: initialIsLoading,
}) {
  const { data } = useEventDetails(eventId);
  const firstRun = data?.runs?.at(0);

  const isLoading = firstRun?.status === "EXECUTING" || initialIsLoading;

  return (
    <TooltipProvider delayDuration={70}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-7 h-7 flex items-center"
            disabled={isLoading}
            onClick={onClick}
          >
            <Icons.Refresh
              size={16}
              className={cn(isLoading && "animate-spin")}
            />
          </Button>
        </TooltipTrigger>

        <TooltipContent className="px-3 py-1.5 text-xs" sideOffset={10}>
          Synchronize
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
