"use client";

import { TZDate } from "@date-fns/tz";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { MetricsFilter } from "@/components/metrics/components/metrics-filter";
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

interface WidgetsHeaderProps {
  isEditing: boolean;
  onToggleEditing: () => void;
}

export function WidgetsHeader({
  isEditing,
  onToggleEditing,
}: WidgetsHeaderProps) {
  const { data: user } = useUserQuery();
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
          here's a quick look at how things are going.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="gap-2 px-2"
          onClick={onToggleEditing}
        >
          {isEditing ? (
            <Check size={16} className="text-[#666]" />
          ) : (
            <Icons.DashboardCustomize size={16} className="text-[#666]" />
          )}
          <span className="hidden sm:inline">
            {isEditing ? "Done" : "Customize"}
          </span>
        </Button>
        <MetricsFilter />
      </div>
    </div>
  );
}
