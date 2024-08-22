import { Skeleton } from "@midday/ui/skeleton";

export function Loading() {
  return (
    <div className="my-6">
      <span className="text-sm font-medium">Recent activity</span>
      <div className="flex space-x-20 mt-6 overflow-auto w-full md:w-[calc(100vw-130px)] scrollbar-hide h-[130px]">
        {...Array.from({ length: 25 }).map((_, i) => (
          <div className="w-[80px]" key={i.toString()}>
            <div className="text-center flex flex-col items-center ml-1">
              <Skeleton className="w-[65px] h-[77px] mb-[14px]" />

              <Skeleton className="w-[50px] h-[15px] mb-[8px]" />
              <Skeleton className="w-[20px] h-[15px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
