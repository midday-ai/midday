import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";

type Props = {
  small?: boolean;
};

export function VaultItemSkeleton({ small }: Props) {
  return (
    <div
      className={cn(
        "h-72 border relative flex p-4 flex-col gap-3",
        small && "h-48",
      )}
    >
      {/* Skeleton for the preview area */}
      <Skeleton
        className={cn("w-[60px] h-[84px]", small && "w-[45px] h-[63px]")}
      />

      {/* Skeleton for title and summary */}
      <div className="flex flex-col mt-3 gap-2">
        <Skeleton className="w-[80%] h-4" />
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-[90%] h-4" />
      </div>

      {/* Skeleton for tags */}
      {!small && (
        <div className="flex gap-2 mt-auto">
          <Skeleton className="w-16 h-6 rounded-full" />
          <Skeleton className="w-20 h-6 rounded-full" />
          <Skeleton className="w-14 h-6 rounded-full" />
        </div>
      )}
    </div>
  );
}
