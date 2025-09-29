"use client";

import { ChatHistory } from "@/components/chat/chat-history";
import { Customize } from "@/components/widgets/customize";
import { useUserQuery } from "@/hooks/use-user";
import { TZDate } from "@date-fns/tz";
import { useEffect, useState } from "react";
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
  if (hour >= 17 && hour < 21) {
    return "Evening";
  }

  return "Night";
}

export function WidgetsHeader() {
  const { data: user } = useUserQuery();
  const isCustomizing = useIsCustomizing();
  const [greeting, setGreeting] = useState(() =>
    getTimeBasedGreeting(user?.timezone ?? undefined),
  );

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
    <div className="flex justify-between items-start mb-8">
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

      <div className="flex items-center space-x-4" data-no-close>
        <Customize />
        <ChatHistory />
      </div>
    </div>
  );
}
