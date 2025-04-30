import { Skeleton } from "@midday/ui/skeleton";

export function BankAccountListSkeleton() {
  return (
    <div className="px-6 pb-6 space-y-6 divide-y">
      <div className="flex justify-between items-center">
        <div className="ml-[30px] divide-y">
          <div className="flex justify-between items-center mb-4 pt-4">
            <div className="flex items-center">
              <Skeleton className="flex h-9 w-9 items-center justify-center space-y-0 rounded-full" />
              <div className="ml-4 flex flex-col">
                <p className="text-sm font-medium leading-none mb-1">
                  <Skeleton className="h-3 w-[200px] rounded-none" />
                </p>
                <span className="text-xs font-medium text-[#606060]">
                  <Skeleton className="h-2.5 w-[100px] mt-1 rounded-none" />
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center mb-4 pt-4">
            <div className="flex items-center">
              <Skeleton className="flex h-9 w-9 items-center justify-center space-y-0 rounded-full" />
              <div className="ml-4 flex flex-col">
                <p className="text-sm font-medium leading-none mb-1">
                  <Skeleton className="h-3 w-[200px] rounded-none" />
                </p>
                <span className="text-xs font-medium text-[#606060]">
                  <Skeleton className="h-2.5 w-[100px] mt-1 rounded-none" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
