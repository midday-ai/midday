/**
 * v0 by Vercel.
 * @see https://v0.dev/t/KjSduJ0IeDO
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */

import { Skeleton } from "../skeleton";

export default function TableSkeleton() {
  return (
    <div className="h-screen w-full rounded-lg border">
      <div className="relative h-full w-full overflow-auto">
        <div className="flex items-center space-x-4 px-6 py-4">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[120px]" />
        </div>
        <div className="flex items-center space-x-4 px-6 py-4">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[120px]" />
        </div>
        <div className="flex items-center space-x-4 px-6 py-4">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[120px]" />
        </div>
        <div className="flex items-center space-x-4 px-6 py-4">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[120px]" />
        </div>
        <div className="flex items-center space-x-4 px-6 py-4">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[120px]" />
        </div>
      </div>
    </div>
  );
}
