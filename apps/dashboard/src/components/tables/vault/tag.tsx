"use client";

import { useI18n } from "@/locales/client";
import { Skeleton } from "@midday/ui/skeleton";

export function Tag({
  name,
  isLoading,
}: {
  name: string;
  isLoading: boolean;
}) {
  const t = useI18n();

  if (isLoading) {
    return <Skeleton className="w-24 h-6 rounded-full" />;
  }

  if (!name) {
    return null;
  }

  return (
    <div className="p-1 text-[#878787] bg-[#F2F1EF] text-[11px] dark:bg-[#1D1D1D] px-3 py-1 rounded-full cursor-default font-mono inline-block">
      {t(`tags.${name}`)}
    </div>
  );
}
