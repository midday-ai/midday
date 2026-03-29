"use client";

import { TZDate } from "@date-fns/tz";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useUserQuery } from "@/hooks/use-user";

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

export function WelcomeSection() {
  const { data: user } = useUserQuery();
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
        You have{" "}
        <Link
          href="/invoices"
          className="border-b border-dashed border-[#878787]/30 hover:text-foreground transition-colors"
        >
          3 unpaid invoices
        </Link>{" "}
        worth $8,200 and{" "}
        <Link
          href="/tracker"
          className="border-b border-dashed border-[#878787]/30 hover:text-foreground transition-colors"
        >
          12 hours
        </Link>{" "}
        of unbilled time. Your inbox is clear.
      </p>
    </div>
  );
}
