"use client";

import { TZDate } from "@date-fns/tz";
import { useSuspenseQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { formatAmount, secondsToHoursAndMinutes } from "@/utils/format";

function getTimeBasedGreeting(timezone?: string): string {
  const userTimezone =
    timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new TZDate(new Date(), userTimezone);
  const hour = now.getHours();

  if (hour >= 5 && hour < 12) {
    return "Good morning";
  }
  if (hour >= 12 && hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}

const linkClass =
  "border-b border-dashed border-[#878787]/30 hover:text-foreground transition-colors";

function buildDescription(
  data: {
    openInvoices: { count: number; totalAmount: number; currency: string };
    unbilledTime: { totalDuration: number; projectCount: number };
    inboxPending: { count: number };
    transactionsToReview: { count: number };
  },
  locale?: string | null,
) {
  const parts: React.ReactNode[] = [];
  const { openInvoices, unbilledTime, inboxPending, transactionsToReview } =
    data;

  if (openInvoices.count > 0) {
    const amount = formatAmount({
      amount: openInvoices.totalAmount,
      currency: openInvoices.currency,
      maximumFractionDigits: 0,
      locale,
    });

    parts.push(
      <span key="invoices">
        <Link
          href="/invoices?statuses=draft,scheduled,unpaid"
          className={linkClass}
        >
          {openInvoices.count} open{" "}
          {openInvoices.count === 1 ? "invoice" : "invoices"}
        </Link>{" "}
        worth {amount}
      </span>,
    );
  }

  if (unbilledTime.totalDuration > 0) {
    const timeStr = secondsToHoursAndMinutes(unbilledTime.totalDuration);
    parts.push(
      <span key="time">
        <Link href="/tracker?status=in_progress" className={linkClass}>
          {timeStr}
        </Link>{" "}
        of unbilled time
      </span>,
    );
  }

  if (transactionsToReview.count > 0) {
    parts.push(
      <span key="transactions">
        <Link href="/transactions?tab=review" className={linkClass}>
          {transactionsToReview.count}{" "}
          {transactionsToReview.count === 1 ? "transaction" : "transactions"}
        </Link>{" "}
        ready to export
      </span>,
    );
  }

  if (inboxPending.count > 0) {
    parts.push(
      <span key="inbox">
        <Link href="/inbox?status=pending" className={linkClass}>
          {inboxPending.count} inbox{" "}
          {inboxPending.count === 1 ? "item" : "items"}
        </Link>{" "}
        to review
      </span>,
    );
  }

  if (parts.length === 0) {
    return <span>Everything is up to date. Nothing needs your attention.</span>;
  }

  return (
    <span>
      You have{" "}
      {parts.map((part, i) => (
        <span key={`wrap-${i}`}>
          {i > 0 && i === parts.length - 1 ? " and " : i > 0 ? ", " : ""}
          {part}
        </span>
      ))}
      .
    </span>
  );
}

export function WelcomeSection() {
  const { data: user } = useUserQuery();
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.overview.summary.queryOptions());
  const [greeting, setGreeting] = useState(() =>
    getTimeBasedGreeting(user?.timezone ?? undefined),
  );

  useEffect(() => {
    setGreeting(getTimeBasedGreeting(user?.timezone ?? undefined));

    const interval = setInterval(
      () => {
        setGreeting(getTimeBasedGreeting(user?.timezone ?? undefined));
      },
      5 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [user?.timezone]);

  const firstName = user?.fullName?.split(" ")[0];

  return (
    <div className="flex flex-col items-center text-center pt-6 pb-10 w-full">
      <h1 className="text-[38px] font-serif leading-tight">
        {greeting}
        {firstName ? (
          <>
            , <span className="text-muted-foreground">{firstName}</span>
          </>
        ) : null}
      </h1>
      <p className="text-muted-foreground text-sm mt-3 max-w-md leading-relaxed">
        {buildDescription(data, user?.locale)}
      </p>
    </div>
  );
}
