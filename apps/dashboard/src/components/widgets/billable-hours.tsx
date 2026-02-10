"use client";

import { Icons } from "@midday/ui/icons";
import { useRouter } from "next/navigation";
import { FormatAmount } from "@/components/format-amount";
import { useBillableHours } from "@/hooks/use-billable-hours";
import { useI18n } from "@/locales/client";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function BillableHoursWidget() {
  const router = useRouter();
  const t = useI18n();

  // Single source of truth for billable hours with polling
  const { data: billableData, isLoading } = useBillableHours({
    date: new Date(),
    view: "month",
    refetchInterval: WIDGET_POLLING_CONFIG.refetchInterval,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title={t("billable_hours.title")}
        icon={<Icons.Tracker className="size-4" />}
      />
    );
  }

  const hasBillableHours = billableData && billableData.totalDuration > 0;
  const earningsByCurrency = billableData?.earningsByCurrency || {};
  const currencyEntries = Object.entries(earningsByCurrency);

  const handleViewTracker = () => {
    router.push("/tracker");
  };

  const hours = hasBillableHours
    ? Math.floor((billableData.totalDuration || 0) / 3600)
    : 0;

  const minutes = hasBillableHours
    ? Math.floor(((billableData.totalDuration || 0) % 3600) / 60)
    : 0;

  return (
    <BaseWidget
      title={t("billable_hours.title")}
      description={
        <div className="flex flex-wrap gap-4">
          {currencyEntries.map(([currency, amount]) => (
            <span key={currency} className="text-xs text-[#666]">
              <span className="font-mono">
                <FormatAmount
                  amount={Math.round(amount)}
                  currency={currency}
                  minimumFractionDigits={0}
                  maximumFractionDigits={0}
                />
              </span>
              <span> this month</span>
            </span>
          ))}
          {currencyEntries.length === 0 && (
            <span className="text-xs text-[#666]">
              {t("billable_hours.no_hours")}
            </span>
          )}
        </div>
      }
      icon={<Icons.Tracker className="size-4" />}
      onClick={handleViewTracker}
      actions={t("billable_hours.view_tracker")}
    >
      <div className="flex flex-col gap-2 select-text">
        <div className="text-2xl flex items-baseline gap-1 space-x-2">
          <div>
            <span>{hours || 0}</span>
            <span className="relative">h</span>
          </div>
          <div>
            <span>{minutes || 0}</span>
            <span className="relative">m</span>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
