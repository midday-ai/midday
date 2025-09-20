"use client";

import { cn } from "@midday/ui/cn";
import { Skeleton as UISkeleton } from "@midday/ui/skeleton";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

export function Skeleton({
  className,
  width = "100%",
  height = "1rem",
  rounded = false,
}: SkeletonProps) {
  return (
    <UISkeleton
      className={cn("w-full", rounded ? "rounded" : "rounded-none", className)}
      style={{ width, height }}
    />
  );
}

export function SkeletonLine({
  width = "100%",
  className,
}: {
  width?: string;
  className?: string;
}) {
  return (
    <UISkeleton
      className={cn("mb-2 h-3 w-full rounded-none", className)}
      style={{ width }}
    />
  );
}

export function SkeletonCard({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "border p-3 bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d] rounded-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SkeletonChart({
  height = "20rem",
  className,
}: {
  height?: string | number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Chart Header Skeleton */}
      <div className="flex items-center justify-between">
        <UISkeleton className="w-32 h-[1.125rem] rounded-none" />
        <div className="flex gap-4 items-center">
          <div className="flex gap-2 items-center">
            <UISkeleton className="w-2 h-2 rounded-none" />
            <UISkeleton className="w-12 h-3 rounded-none" />
          </div>
          <div className="flex gap-2 items-center">
            <UISkeleton className="w-2 h-2 rounded-none" />
            <UISkeleton className="w-12 h-3 rounded-none" />
          </div>
        </div>
      </div>

      {/* Chart Area Skeleton */}
      <UISkeleton
        className="opacity-20 w-full rounded-none"
        style={{ height }}
      />
    </div>
  );
}

export function SkeletonGrid({
  columns = 2,
  className,
}: {
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };

  const skeletonItems = Array.from({ length: columns * 2 }, (_, i) => {
    const uniqueId = `skeleton-card-${columns}-${i}`;
    return (
      <SkeletonCard key={uniqueId}>
        <SkeletonLine width="5rem" />
        <UISkeleton className="mb-1 w-16 h-5 rounded-none" />
        <SkeletonLine width="6rem" />
      </SkeletonCard>
    );
  });

  return (
    <div className={cn("grid gap-3", gridCols[columns], className)}>
      {skeletonItems}
    </div>
  );
}
