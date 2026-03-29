"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { formatAmount, secondsToHoursAndMinutes } from "@/utils/format";

interface WidgetCardProps {
  label: string;
  href: string;
  value: string;
  detail?: string;
}

function WidgetCard({ label, href, value, detail }: WidgetCardProps) {
  return (
    <Link
      href={href}
      className="h-full border p-5 flex flex-col justify-between transition-all duration-300 bg-white border-[#e6e6e6] hover:bg-[#f7f7f7] hover:border-[#d0d0d0] dark:bg-[#0c0c0c] dark:border-[#1d1d1d] dark:hover:bg-[#0f0f0f] dark:hover:border-[#222222] cursor-pointer group min-h-[110px]"
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="mt-3">
        <span className="text-xl font-medium">{value}</span>
        {detail ? (
          <span className="text-xs text-muted-foreground ml-2">{detail}</span>
        ) : null}
      </div>
    </Link>
  );
}

export function WidgetCards() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.overview.summary.queryOptions());
  const { data: user } = useUserQuery();
  const locale = user?.locale;

  const cashValue =
    formatAmount({
      amount: data.cashBalance.totalBalance,
      currency: data.cashBalance.currency,
      maximumFractionDigits: 0,
      locale,
    }) ?? "$0";

  const cashDetail =
    data.cashBalance.accountCount > 0
      ? `across ${data.cashBalance.accountCount} ${data.cashBalance.accountCount === 1 ? "account" : "accounts"}`
      : undefined;

  const openValue = String(data.openInvoices.count);
  const openAmount = formatAmount({
    amount: data.openInvoices.totalAmount,
    currency: data.openInvoices.currency,
    maximumFractionDigits: 0,
    locale,
  });
  const openDetail =
    data.openInvoices.count > 0 ? `${openAmount} outstanding` : "All paid";

  const hasUnbilledAmount = data.unbilledTime.totalAmount > 0;
  const unbilledTimeStr = secondsToHoursAndMinutes(
    data.unbilledTime.totalDuration,
  );
  const unbilledValue = hasUnbilledAmount
    ? (formatAmount({
        amount: data.unbilledTime.totalAmount,
        currency: data.unbilledTime.currency,
        maximumFractionDigits: 0,
        locale,
      }) ?? unbilledTimeStr)
    : unbilledTimeStr;

  const unbilledDetail = hasUnbilledAmount
    ? [
        unbilledTimeStr,
        data.unbilledTime.projectCount > 0
          ? `across ${data.unbilledTime.projectCount} ${data.unbilledTime.projectCount === 1 ? "project" : "projects"}`
          : null,
      ]
        .filter(Boolean)
        .join(" ")
    : data.unbilledTime.projectCount > 0
      ? `across ${data.unbilledTime.projectCount} ${data.unbilledTime.projectCount === 1 ? "project" : "projects"}`
      : undefined;

  const runwayValue =
    data.runway > 0
      ? `${data.runway} ${data.runway === 1 ? "mo" : "mos"}`
      : "-";
  const runwayDetail = data.runway > 0 ? "at current burn rate" : "No data yet";

  const reviewValue = String(data.transactionsToReview.count);
  const reviewDetail =
    data.transactionsToReview.count === 0
      ? "All up to date"
      : "Ready to export";

  const inboxValue = String(data.inboxPending.count);
  const inboxDetail =
    data.inboxPending.count === 0 ? "All caught up" : "To review";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
      <WidgetCard
        label="Cash Balance"
        href="/reports?scrollTo=cash-balance"
        value={cashValue}
        detail={cashDetail}
      />
      <WidgetCard
        label="Open Invoices"
        href="/invoices?statuses=draft,scheduled,unpaid"
        value={openValue}
        detail={openDetail}
      />
      <WidgetCard
        label="Unbilled Time"
        href="/tracker?status=in_progress"
        value={unbilledValue}
        detail={unbilledDetail}
      />
      <WidgetCard
        label="Transactions"
        href="/transactions?tab=review"
        value={reviewValue}
        detail={reviewDetail}
      />
      <WidgetCard
        label="Runway"
        href="/reports?scrollTo=runway"
        value={runwayValue}
        detail={runwayDetail}
      />
      <WidgetCard
        label="Inbox"
        href="/inbox?status=pending"
        value={inboxValue}
        detail={inboxDetail}
      />
    </div>
  );
}
