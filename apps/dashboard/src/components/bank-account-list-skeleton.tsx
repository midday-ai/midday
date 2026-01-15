import { Skeleton } from "@midday/ui/skeleton";

function BankAccountCardSkeleton() {
  return (
    <div className="border border-border p-4 flex flex-col gap-3 h-full">
      {/* Header: Name, Actions, Toggle */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
      </div>

      {/* Balance */}
      <Skeleton className="h-6 w-24" />
    </div>
  );
}

function BankConnectionSkeleton() {
  return (
    <div className="py-4">
      {/* Connection Header */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-4 items-center">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <BankAccountCardSkeleton />
        <BankAccountCardSkeleton />
      </div>
    </div>
  );
}

export function BankAccountListSkeleton() {
  return (
    <div className="divide-y">
      <BankConnectionSkeleton />
      <BankConnectionSkeleton />
    </div>
  );
}
