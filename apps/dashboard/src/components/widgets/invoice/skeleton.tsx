import { Skeleton } from "@midday/ui/skeleton";

function InvoiceRowSkeleton() {
  return (
    <li className="h-[57px] flex items-center w-full">
      <div className="flex items-center w-full">
        <div className="flex flex-col space-y-1 w-1/4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>

        <div className="w-1/4">
          <Skeleton className="h-5 w-16" />
        </div>

        <div className="w-1/4">
          <Skeleton className="h-4 w-24" />
        </div>

        <div className="w-1/4 flex justify-end">
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </li>
  );
}

export function InvoiceWidgetSkeleton() {
  return (
    <div className="mt-8">
      <div className="flex justify-between items-center p-3 py-2 border border-border">
        <div className="w-1/2">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {Array.from({ length: 10 }).map((_, index) => (
          <InvoiceRowSkeleton key={index.toString()} />
        ))}
      </div>
    </div>
  );
}
