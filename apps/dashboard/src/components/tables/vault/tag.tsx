"use client";

import { useI18n } from "@/locales/client";
import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";

export function Tag({
  name,
  isLoading,
  className,
}: {
  name?: string;
  isLoading?: boolean;
  className?: string;
}) {
  const t = useI18n();

  if (isLoading) {
    return <Skeleton className="w-24 h-6 rounded-full" />;
  }

  if (!name) {
    return null;
  }

  return (
    <div
      className={cn(
        "p-1 text-[#878787] bg-[#F2F1EF] text-[10px] dark:bg-[#1D1D1D] px-3 py-1 rounded-full cursor-default font-mono inline-flex max-w-full",
        className,
      )}
    >
      <span className="line-clamp-1 truncate inline-block">
        {t(`tags.${name}`)}
      </span>
    </div>
  );
}
