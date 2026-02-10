"use client";

import { TZDate } from "@date-fns/tz";
import { cn } from "@midday/ui/cn";
import { TabsList, TabsTrigger } from "@midday/ui/tabs";
import { useEffect, useState } from "react";
import { MetricsFilter } from "@/components/metrics/components/metrics-filter";
import { Customize } from "@/components/widgets/customize";
import { useForesightMetricsPrefetch } from "@/hooks/use-foresight-prefetch";
import { useUserQuery } from "@/hooks/use-user";
import { useIsCustomizing } from "./widget-provider";

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
  const isCustomizing = useIsCustomizing();
  const [greeting, setGreeting] = useState(() =>
    getTimeBasedGreeting(user?.timezone ?? undefined),
  );
  const { elementRef: metricsTabRef } = useForesightMetricsPrefetch();

  useEffect(() => {
    // Update greeting immediately when user timezone changes
    setGreeting(getTimeBasedGreeting(user?.timezone ?? undefined));

    // Set up interval to update greeting every 5 minutes
    // This ensures the greeting changes naturally as time passes
    const interval = setInterval(
      () => {
        const newGreeting = getTimeBasedGreeting(user?.timezone ?? undefined);
        setGreeting(newGreeting);
      },
      5 * 60 * 1000,
    ); // 5 minutes

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
          <Customize />
        </div>
        <MetricsFilter />
        <div className="ml-2 relative flex items-stretch bg-[#f7f7f7] dark:bg-[#131313] w-fit">
          <TabsList className="flex items-stretch h-auto p-0 bg-transparent">
            <TabsTrigger
              value="overview"
              className={cn(
                "group relative flex items-center gap-1.5 px-3 py-1.5 text-[14px] transition-all whitespace-nowrap border border-transparent h-9 min-h-9",
                "text-[#707070] hover:text-black bg-[#f7f7f7] dark:text-[#666666] dark:hover:text-white dark:bg-[#131313] mb-0 relative z-[1]",
                "data-[state=active]:text-black data-[state=active]:bg-[#e6e6e6] dark:data-[state=active]:text-white dark:data-[state=active]:bg-[#1d1d1d] data-[state=active]:mb-[-1px] data-[state=active]:z-10",
              )}
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              ref={metricsTabRef}
              value="metrics"
              className={cn(
                "group relative flex items-center gap-1.5 px-3 py-1.5 text-[14px] transition-all whitespace-nowrap border border-transparent h-9 min-h-9",
                "text-[#707070] hover:text-black bg-[#f7f7f7] dark:text-[#666666] dark:hover:text-white dark:bg-[#131313] mb-0 relative z-[1]",
                "data-[state=active]:text-black data-[state=active]:bg-[#e6e6e6] dark:data-[state=active]:text-white dark:data-[state=active]:bg-[#1d1d1d] data-[state=active]:mb-[-1px] data-[state=active]:z-10",
              )}
            >
              Metrics
            </TabsTrigger>
          </TabsList>
        </div>
      </div>
    </div>
  );
}
