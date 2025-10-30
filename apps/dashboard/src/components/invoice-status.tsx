"use client";

import { useI18n } from "@/locales/client";
import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";

export function InvoiceStatus({
  status,
  isLoading,
  className,
}: {
  status?: "draft" | "overdue" | "paid" | "unpaid" | "canceled" | "scheduled";
  isLoading?: boolean;
  className?: string;
}) {
  const t = useI18n();

  if (isLoading) {
    return <Skeleton className="w-24 h-6 rounded-full" />;
  }

  if (!status) {
    return null;
  }

  return (
    <div
      className={cn(
        "px-2 py-0.5 rounded-full cursor-default inline-flex max-w-full text-[11px]",
        (status === "draft" || status === "canceled") &&
          "text-[#878787] bg-[#F2F1EF] text-[10px] dark:text-[#878787] dark:bg-[#1D1D1D]",
        status === "overdue" &&
          "bg-[#FFD02B]/10 text-[#FFD02B] dark:bg-[#FFD02B]/10 dark:text-[#FFD02B]",
        status === "paid" &&
          "text-[#00C969] bg-[#DDF1E4] dark:text-[#00C969] dark:bg-[#00C969]/10",
        status === "unpaid" &&
          "text-[#1D1D1D] bg-[#878787]/10 dark:text-[#F5F5F3] dark:bg-[#F5F5F3]/10",
        status === "scheduled" &&
          "text-[#1F6FEB] bg-[#DDEBFF] dark:text-[#1F6FEB] dark:bg-[#1F6FEB]/10",
        className,
      )}
    >
      <span className="line-clamp-1 truncate inline-block">
        {t(`invoice_status.${status}`)}
      </span>
    </div>
  );
}
