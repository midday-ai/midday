"use client";

import { useUserQuery } from "@/hooks/use-user";
import { TZDate } from "@date-fns/tz";

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
  if (hour >= 17 && hour < 21) {
    return "Evening";
  }

  return "Night";
}

export function OverviewHeader() {
  const { data: user } = useUserQuery();
  const greeting = getTimeBasedGreeting(user?.timezone ?? undefined);

  return (
    <div>
      <h1 className="text-[30px] font-serif leading-normal mb-1">
        <span>{greeting} </span>
        <span className="text-[#666666]">{user?.fullName?.split(" ")[0]},</span>
      </h1>
      <p className="text-[#666666] text-[14px]">
        here's a quick look at how things are going.
      </p>
    </div>
  );
}
