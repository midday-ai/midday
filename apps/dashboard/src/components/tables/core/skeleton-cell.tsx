"use client";

import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";
import type { SkeletonType } from "./types";

interface SkeletonCellProps {
  type: SkeletonType;
  width?: string;
}

/**
 * Renders skeleton content based on the skeleton type
 * Used by TableSkeleton to render appropriate loading states for each column
 */
export function SkeletonCell({ type, width = "w-24" }: SkeletonCellProps) {
  switch (type) {
    case "checkbox":
      return <Skeleton className="h-4 w-4" />;

    case "text":
      return <Skeleton className={cn("h-3.5", width)} />;

    case "avatar-text":
      return (
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
          <Skeleton className={cn("h-3.5", width)} />
        </div>
      );

    case "icon-text":
      return (
        <div className="flex items-center space-x-2">
          <Skeleton className="h-[9px] w-[9px] flex-shrink-0" />
          <Skeleton className={cn("h-3.5", width)} />
        </div>
      );

    case "badge":
      return <Skeleton className={cn("h-5", width)} />;

    case "tags":
      return (
        <div className="flex items-center space-x-1">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-16" />
        </div>
      );

    case "icon":
      return <Skeleton className="h-5 w-5" />;

    default:
      return <Skeleton className={cn("h-3.5", width)} />;
  }
}
