import { Card } from "@midday/ui/card";
import { Skeleton } from "@midday/ui/skeleton";

export function AppsSkeleton() {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 mx-auto mt-8">
      {Array.from({ length: 8 }).map((_, index) => (
        <Card key={index.toString()} className="w-full flex flex-col">
          <div className="p-6">
            <Skeleton className="h-10 w-10 rounded-full" />

            <div className="mt-6">
              <Skeleton className="h-5 w-[40%]" />
            </div>
            <div className="space-y-2 py-4 pb-0">
              <Skeleton className="h-4 w-[80%]" />
              <Skeleton className="h-4 w-[70%]" />
              <Skeleton className="h-4 w-[160px]" />
            </div>
            <div className="flex items-center justify-between space-x-2 mt-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
