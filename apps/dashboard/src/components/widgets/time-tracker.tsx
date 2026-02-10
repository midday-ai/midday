import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { endOfWeek, formatISO, startOfWeek } from "date-fns";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { secondsToHoursAndMinutes } from "@/utils/format";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function TimeTrackerWidget() {
  const trpc = useTRPC();
  const router = useRouter();
  const { data: user } = useUserQuery();

  // Calculate current week range
  const currentWeekRange = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, {
      weekStartsOn: user?.weekStartsOnMonday ? 1 : 0,
    });

    const weekEnd = endOfWeek(now, {
      weekStartsOn: user?.weekStartsOnMonday ? 1 : 0,
    });

    return {
      from: formatISO(weekStart, { representation: "date" }),
      to: formatISO(weekEnd, { representation: "date" }),
    };
  }, [user?.weekStartsOnMonday]);

  // Fetch tracked time for the current week
  const { data, isLoading } = useQuery({
    ...trpc.widgets.getTrackedTime.queryOptions(currentWeekRange),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="Time Tracker"
        icon={<Icons.Tracker className="size-4" />}
      />
    );
  }

  const totalWeeklyTime = data?.result?.totalDuration ?? 0;

  const handleOpenTracker = () => {
    router.push("/tracker");
  };

  return (
    <BaseWidget
      title="Time Tracker"
      icon={<Icons.Tracker className="size-4" />}
      description="Tracked time this week"
      onClick={handleOpenTracker}
      actions="Open time tracker"
    >
      <h2 className="text-2xl font-normal text-[24px] mb-2">
        {secondsToHoursAndMinutes(totalWeeklyTime)}
      </h2>
    </BaseWidget>
  );
}
