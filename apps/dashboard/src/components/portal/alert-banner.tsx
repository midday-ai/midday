"use client";

import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { useSuspenseQuery } from "@tanstack/react-query";

type Alert = {
  type: "danger" | "warning" | "success";
  message: string;
};

type Props = {
  portalId: string;
};

export function AlertBanner({ portalId }: Props) {
  const trpc = useTRPC();
  const { data: portalData } = useSuspenseQuery(
    trpc.merchantPortal.getPortalData.queryOptions({ portalId }),
  );

  if (!portalData) return null;

  const { deals } = portalData;
  const alerts: Alert[] = [];

  // Check for NSF payments
  const totalNsf = deals.reduce((sum, d) => sum + (d.nsfCount || 0), 0);
  if (totalNsf > 0) {
    alerts.push({
      type: "danger",
      message: `${totalNsf} returned payment${totalNsf > 1 ? "s" : ""} on your account. Contact your funder for details.`,
    });
  }

  // Check for late deals
  const lateDeals = deals.filter((d) => d.status === "late");
  if (lateDeals.length > 0) {
    alerts.push({
      type: "warning",
      message: `${lateDeals.length} deal${lateDeals.length > 1 ? "s" : ""} with late payments. Please review your payment schedule.`,
    });
  }

  // Check for approaching payoff
  for (const deal of deals) {
    if (deal.status === "active" && deal.currentBalance && deal.paybackAmount) {
      const paidPct = ((deal.paybackAmount - deal.currentBalance) / deal.paybackAmount) * 100;
      if (paidPct >= 90) {
        alerts.push({
          type: "success",
          message: `Almost there! Deal ${deal.dealCode} is ${Math.round(paidPct)}% paid off.`,
        });
      }
    }
  }

  // Check for fully paid deals
  const paidDeals = deals.filter((d) => d.status === "paid_off");
  if (paidDeals.length > 0) {
    alerts.push({
      type: "success",
      message: `Congratulations! ${paidDeals.length} deal${paidDeals.length > 1 ? "s" : ""} fully paid off.`,
    });
  }

  if (alerts.length === 0) return null;

  const bgColors = {
    danger: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    success: "bg-green-50 border-green-200 text-green-800",
  };

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${bgColors[alert.type]}`}
        >
          <Icons.AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{alert.message}</span>
        </div>
      ))}
    </div>
  );
}
