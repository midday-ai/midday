"use client";

import { cn } from "@midday/ui/cn";
import { Skeleton } from "@/components/canvas/base/skeleton";

interface CanvasSectionProps {
  title?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function CanvasSection({
  title,
  children,
  isLoading = false,
  className,
}: CanvasSectionProps) {
  if (isLoading) {
    return (
      <div className={cn("mb-6", className)}>
        {title && <Skeleton width="6rem" height="1rem" className="mb-3" />}
        <div className="space-y-2">
          <Skeleton width="100%" height="0.875rem" />
          <Skeleton width="85%" height="0.875rem" />
          <Skeleton width="90%" height="0.875rem" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("mt-8 mb-4", className)}>
      {title && (
        <h3 className="text-[12px] leading-normal mb-3 text-[#707070] dark:text-[#666666]">
          {title}
        </h3>
      )}
      <div className="text-[12px] leading-[17px] font-sans text-black dark:text-white">
        {children}
      </div>
    </div>
  );
}
