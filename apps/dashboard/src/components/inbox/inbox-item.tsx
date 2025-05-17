import { FormatAmount } from "@/components/format-amount";
import { InboxStatus } from "@/components/inbox/inbox-status";
import { useInboxParams } from "@/hooks/use-inbox-params";
import { useUserQuery } from "@/hooks/use-user";
import { formatDate } from "@/utils/format";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";

type Props = {
  item: RouterOutputs["inbox"]["get"]["data"][number];
  index: number;
};

export function InboxItem({ item, index }: Props) {
  const { params, setParams } = useInboxParams();
  const { data: user } = useUserQuery();

  const isSelected =
    params.inboxId === item.id || (!params.inboxId && index === 0);
  const isProcessing = item.status === "processing" || item.status === "new";

  return (
    <button
      type="button"
      onClick={() => {
        setParams({ inboxId: item.id });
      }}
      key={item.id}
      className={cn(
        "flex flex-col w-full items-start gap-2 border p-4 text-left text-sm h-[90px]",
        isSelected && "bg-accent border-[#DCDAD2] dark:border-[#2C2C2C]",
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
            <InboxStatus item={item} />
          </div>
        </div>
      </div>
    </button>
  );
}
