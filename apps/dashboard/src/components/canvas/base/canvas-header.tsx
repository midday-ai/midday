"use client";

import { Skeleton } from "@/components/canvas/base/skeleton";
import { cn } from "@midday/ui/cn";

interface CanvasHeaderProps {
  title: string;
  description?: string;
  isLoading?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

export function CanvasHeader({
  title,
  description,
  isLoading = false,
  actions,
  className,
}: CanvasHeaderProps) {
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-between", className)}>
        <div className="space-y-2">
          <Skeleton width="8rem" height="1.125rem" />
          {description && <Skeleton width="12rem" height="0.875rem" />}
        </div>
        {actions && (
          <div className="flex gap-2">
            <Skeleton width="3rem" height="2rem" />
            <Skeleton width="3rem" height="2rem" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-between mb-8", className)}>
      <div>
        <h2 className="text-[12px] leading-[23px] text-[#707070] dark:text-[#666666]">
          {title}
        </h2>
        {description && (
          <p className="text-[12px] text-[#707070] dark:text-[#666666] mt-1">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
