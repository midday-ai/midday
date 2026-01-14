import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";

interface WidgetSkeletonProps {
  /**
   * Widget title - shown immediately
   */
  title: string;
  /**
   * Widget icon - shown immediately (optional)
   */
  icon?: React.ReactNode;
  /**
   * Number of description lines to show as skeleton
   * @default 1
   */
  descriptionLines?: number;
  /**
   * Whether to show the main value skeleton (large text)
   * @default true
   */
  showValue?: boolean;
  /**
   * Custom className
   */
  className?: string;
}

export function WidgetSkeleton({
  title,
  icon,
  descriptionLines = 1,
  showValue = true,
  className,
}: WidgetSkeletonProps) {
  return (
    <div
      className={cn(
        "dark:bg-[#0c0c0c] border dark:border-[#1d1d1d] p-4 h-[210px] flex flex-col justify-between",
        className,
      )}
    >
      <div>
        {/* Header - title and icon are shown immediately */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon && <span className="text-[#666666]">{icon}</span>}
            <h3 className="text-xs text-[#666666] font-medium">{title}</h3>
          </div>
        </div>

        {/* Description skeleton */}
        <div className="space-y-2">
          {Array.from({ length: descriptionLines }).map((_, i) => (
            <Skeleton
              key={i.toString()}
              className={cn(
                "h-3",
                i === descriptionLines - 1 ? "w-3/4" : "w-full",
              )}
            />
          ))}
        </div>
      </div>

      <div>
        {/* Value skeleton */}
        {showValue && <Skeleton className="h-8 w-24 mb-2" />}

        {/* Action skeleton */}
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}
