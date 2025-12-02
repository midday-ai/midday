import { FormatAmount } from "@/components/format-amount";
import { InboxStatus } from "@/components/inbox/inbox-status";
import { useInboxParams } from "@/hooks/use-inbox-params";
import { useUserQuery } from "@/hooks/use-user";
import { useInboxStore } from "@/store/inbox";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Badge } from "@midday/ui/badge";
import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { formatDate } from "@midday/utils/format";
import { forwardRef } from "react";

type Props = {
  item: RouterOutputs["inbox"]["get"]["data"][number];
  index: number;
  onItemClick?: (e: React.MouseEvent, index: number) => void;
};

export const InboxItem = forwardRef<HTMLButtonElement, Props>(
  function InboxItem({ item, index, onItemClick }, ref) {
    const { params, setParams } = useInboxParams();
    const { data: user } = useUserQuery();
    const { selectedIds, toggleSelection, setLastClickedIndex } =
      useInboxStore();

    const isNavigationSelected =
      params.inboxId === item.id || (!params.inboxId && index === 0);
    const isBulkSelected = selectedIds[item.id] === true;
    const isSelectionMode = Object.keys(selectedIds).length > 0;
    const isSelected =
      isBulkSelected || (!isSelectionMode && isNavigationSelected);
    const isProcessing = item.status === "processing" || item.status === "new";

    const handleClick = (e: React.MouseEvent) => {
      // If shift is held, handle range selection
      if (e.shiftKey) {
        onItemClick?.(e, index);
        return;
      }

      // If Cmd/Ctrl is held, toggle selection and navigate
      if (e.metaKey || e.ctrlKey) {
        toggleSelection(item.id);
        setLastClickedIndex(index);
        // Still navigate when Cmd/Ctrl clicking
        if (!isBulkSelected) {
          setParams({ inboxId: item.id });
        }
        return;
      }

      // Regular click: toggle selection
      toggleSelection(item.id);
      setLastClickedIndex(index);

      // Navigate only if this item wasn't already selected
      if (!isBulkSelected) {
        setParams({ inboxId: item.id });
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        key={item.id}
        className={cn(
          "flex flex-col w-full items-start gap-2 border p-4 text-left text-sm h-[90px] transition-colors",
          (isNavigationSelected && !isSelectionMode) || isBulkSelected
            ? "bg-accent border-[#DCDAD2] dark:border-[#2C2C2C]"
            : "",
        )}
      >
        <div className="flex w-full flex-col gap-1">
          <div className="flex items-center mb-1">
            <div className="flex items-center gap-2">
              <div className="flex items-center space-x-2 select-text">
                <div className="font-semibold">
                  {isProcessing ? (
                    <Skeleton className="h-3 w-[120px] mb-1" />
                  ) : (
                    item.displayName
                  )}
                </div>
                {!isProcessing &&
                  item.relatedCount !== undefined &&
                  item.relatedCount > 0 && (
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="outline"
                            className="h-4 px-1.5 text-[10px] font-normal"
                          >
                            +{item.relatedCount}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs px-3 py-1.5">
                          {item.relatedCount === 1
                            ? "Grouped with 1 other document"
                            : `Grouped with ${item.relatedCount} other documents`}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
              </div>
            </div>
            <div
              className={cn(
                "ml-auto text-xs select-text",
                isSelected ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {isProcessing && <Skeleton className="h-3 w-[50px]" />}
              {!isProcessing &&
                item?.date &&
                formatDate(item.date, user?.dateFormat)}
            </div>
          </div>

          <div className="flex">
            <div className="text-xs font-medium select-text">
              {isProcessing && <Skeleton className="h-3 w-[50px]" />}
              {!isProcessing && item?.currency && (
                <FormatAmount
                  amount={item.amount ?? 0}
                  currency={item.currency}
                />
              )}
            </div>

            <div className="ml-auto">
              {isProcessing ? (
                <Skeleton className="h-4 w-[60px]" />
              ) : (
                <InboxStatus item={item} />
              )}
            </div>
          </div>
        </div>
      </button>
    );
  },
);
