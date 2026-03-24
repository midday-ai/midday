"use client";

import { TZDate } from "@date-fns/tz";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useEffect, useState } from "react";
import { MetricsFilter } from "@/components/metrics/components/metrics-filter";
import { useMetricsCustomize } from "@/hooks/use-metrics-customize";
import { useUserQuery } from "@/hooks/use-user";

function getTimeBasedGreeting(timezone?: string): string {
  const userTimezone =
    timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new TZDate(new Date(), userTimezone);
  const hour = now.getHours();

  if (hour >= 5 && hour < 12) {
    return "Morning";
  }
  if (hour >= 12 && hour < 17) {
    return "Afternoon";
  }

  return "Evening";
}

export function WidgetsHeader() {
  const { data: user } = useUserQuery();
  const { isCustomizing, setIsCustomizing } = useMetricsCustomize();
  const [greeting, setGreeting] = useState(() =>
    getTimeBasedGreeting(user?.timezone ?? undefined),
  );

  useEffect(() => {
    setGreeting(getTimeBasedGreeting(user?.timezone ?? undefined));

    const interval = setInterval(
      () => {
        const newGreeting = getTimeBasedGreeting(user?.timezone ?? undefined);
        setGreeting(newGreeting);
      },
      5 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [user?.timezone]);

  return (
    <div className="flex justify-between items-end mb-6">
      <div>
        <h1 className="text-[30px] font-serif leading-normal mb-1">
          <span>{greeting} </span>
          <span className="text-[#666666]">
            {user?.fullName?.split(" ")[0]},
          </span>
        </h1>
        <p className="text-[#666666] text-[14px]">
          {isCustomizing
            ? "drag and drop to arrange your perfect dashboard."
            : "here's a quick look at how things are going."}
        </p>
      </div>

      <div className="flex items-center gap-2" data-no-close>
        <div className="hidden md:block">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => setIsCustomizing(!isCustomizing)}
          >
            {isCustomizing ? (
              <Icons.Check size={16} />
            ) : (
              <Icons.DashboardCustomize size={16} />
            )}
          </Button>
        </div>
        <MetricsFilter />
      </div>
    </div>
  );
}
