"use client";

import Link from "next/link";

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
      className="flex flex-col justify-between border border-border bg-background p-5 hover:border-primary/30 transition-colors min-h-[110px]"
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
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      <WidgetCard
        label="Cash Balance"
        href="/transactions"
        value="$42,300"
        detail="+$3,200 this month"
      />

      <WidgetCard
        label="Profit This Month"
        href="/reports"
        value="$4,820"
        detail="⋅ +12% vs last month"
      />

      <WidgetCard
        label="Unpaid Invoices"
        href="/invoices"
        value="3"
        detail="$8,200 outstanding ⋅ 1 overdue"
      />

      <WidgetCard
        label="Unbilled Time"
        href="/tracker"
        value="12h"
        detail="across 3 projects"
      />

      <WidgetCard
        label="Burn Rate"
        href="/reports"
        value="$7,630"
        detail="/mo ⋅ -8% vs last month"
      />

      <WidgetCard
        label="Inbox to Review"
        href="/inbox"
        value="0"
        detail="All caught up"
      />
    </div>
  );
}
