import { Skeleton } from "@midday/ui/skeleton";

export function TransactionsListSkeleton() {
  return (
    <div className="divide-y">
      {[...Array(12)].map((_, index) => (
        <div
          key={index.toString()}
          className="flex justify-between px-3 items-center h-[49px]"
        >
          <div className="w-[60%]">
            <Skeleton className="h-3 w-[50%]" />
          </div>
          <div className="w-[40%] ml-auto">
            <Skeleton className="w-[60%] h-3 align-start" />
          </div>
        </div>
      ))}
    </div>
  );
}
