"use client";

import { useI18n } from "@/locales/client";
import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";

export function InvoiceStatus({
  status,
  isLoading,
  className,
}: {
  status: "draft" | "overdue" | "paid" | "unpaid" | "cancelled";
  isLoading?: boolean;
  className?: string;
}) {
  const t = useI18n();

  if (isLoading) {
    return <Skeleton className="w-24 h-6 rounded-full" />;
  }

  return (
    <div
      className={cn(
        "p-1 px-3 py-1 rounded-full cursor-default font-mono inline-flex max-w-full text-xs",
        status === "draft" &&
          "text-[#878787] bg-[#F2F1EF] text-[10px] dark:bg-[#1D1D1D]",
        status === "overdue" && "bg-red-200",
        status === "paid" && "bg-green-200",
        status === "unpaid" && "bg-yellow-200",
        className,
      )}
    >
      <span className="line-clamp-1 truncate inline-block">
        {t(`invoice.status.${status}`)}
      </span>
    </div>
  );
}
