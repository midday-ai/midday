"use client";

import { useTrackerParams } from "@/hooks/use-tracker-params";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { secondsToHoursAndMinutes } from "@/utils/format";
import { TZDate } from "@date-fns/tz";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@midday/ui/hover-card";
import { useQuery } from "@tanstack/react-query";
import {
  endOfMonth,
  endOfWeek,
  formatISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useMemo } from "react";
import { FormatAmount } from "./format-amount";

type Props = {
  selectedView: "week" | "month";
};

export function TotalEarnings({ selectedView }: Props) {
  const { data: user } = useUserQuery();
  const trpc = useTRPC();
  const { date: currentDate } = useTrackerParams();

  const weekStartsOnMonday = user?.weekStartsOnMonday ?? false;
  const currentTZDate = new TZDate(currentDate, "UTC");

  // Calculate date range based on current view
  const dateRange = useMemo(() => {
    if (selectedView === "week") {
      const weekStart = startOfWeek(currentTZDate, {
        weekStartsOn: weekStartsOnMonday ? 1 : 0,
      });
      const weekEnd = endOfWeek(currentTZDate, {
        weekStartsOn: weekStartsOnMonday ? 1 : 0,
      });
      return {
        from: formatISO(weekStart, { representation: "date" }),
        to: formatISO(weekEnd, { representation: "date" }),
      };
    }
    return {
      from: formatISO(startOfMonth(currentTZDate), { representation: "date" }),
      to: formatISO(endOfMonth(currentTZDate), { representation: "date" }),
    };
  }, [selectedView, currentTZDate, weekStartsOnMonday]);

  const { data } = useQuery(
    trpc.trackerEntries.byRange.queryOptions(dateRange),
  );

  // Calculate earnings by currency from billable entries
  const earningsByCurrency = useMemo(() => {
    if (!data?.result) return {};

    const earnings: Record<string, number> = {};

    // Iterate through all days and entries
    for (const entry of Object.values(data.result).flat()) {
      // Only include entries from billable projects with rates
      if (
        entry.trackerProject?.billable &&
        entry.trackerProject?.rate &&
        entry.duration
      ) {
        const currency = entry.trackerProject.currency || "USD";
        const rate = Number(entry.trackerProject.rate);
        const hours = entry.duration / 3600; // Convert seconds to hours
        const earning = rate * hours;

        earnings[currency] = (earnings[currency] || 0) + earning;
      }
    }

    return earnings;
  }, [data?.result]);

  // Calculate earnings breakdown by project
  const projectBreakdown = useMemo(() => {
    if (!data?.result) return [];

    const projects: Record<
      string,
      {
        name: string;
        duration: number;
        amount: number;
        currency: string;
      }
    > = {};

    // Iterate through all days and entries
    for (const entry of Object.values(data.result).flat()) {
      // Only include entries from billable projects with rates
      if (
        entry.trackerProject?.billable &&
        entry.trackerProject?.rate &&
        entry.duration
      ) {
        const projectId = entry.trackerProject.id;
        const projectName = entry.trackerProject.name;
        const currency = entry.trackerProject.currency || "USD";
        const rate = Number(entry.trackerProject.rate);
        const hours = entry.duration / 3600; // Convert seconds to hours for calculation
        const earning = rate * hours;

        if (projects[projectId]) {
          projects[projectId].duration += entry.duration;
          projects[projectId].amount += earning;
        } else {
          projects[projectId] = {
            name: projectName,
            duration: entry.duration,
            amount: earning,
            currency,
          };
        }
      }
    }

    return Object.values(projects).sort((a, b) => b.amount - a.amount);
  }, [data?.result]);

  const currencyEntries = Object.entries(earningsByCurrency);

  return (
    <div className="flex flex-wrap gap-4 h-4">
      {currencyEntries.map(([currency, amount]) => (
        <HoverCard key={currency} openDelay={0} closeDelay={100}>
          <HoverCardTrigger asChild>
            <button
              type="button"
              className="text-sm text-[#666] cursor-pointer"
            >
              <span className="font-mono">
                <FormatAmount
                  amount={Math.round(amount)}
                  currency={currency}
                  minimumFractionDigits={0}
                  maximumFractionDigits={0}
                />
              </span>
              <span> this {selectedView === "week" ? "week" : "month"}</span>
            </button>
          </HoverCardTrigger>
          <HoverCardContent className="w-48 p-2 mt-1" align="start">
            <div className="space-y-1">
              {projectBreakdown
                .filter((project) => project.currency === currency)
                .map((project) => (
                  <div
                    key={`${project.name}-${project.currency}`}
                    className="space-y-0.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="font-medium truncate flex-1 min-w-0 mr-1">
                        {project.name}
                      </div>
                      <div className="font-mono text-right">
                        <FormatAmount
                          amount={Math.round(project.amount)}
                          currency={project.currency}
                          minimumFractionDigits={0}
                          maximumFractionDigits={0}
                        />
                      </div>
                    </div>
                    <div className="text-[9px] text-muted-foreground">
                      {secondsToHoursAndMinutes(project.duration)}
                    </div>
                  </div>
                ))}
              {projectBreakdown.filter(
                (project) => project.currency === currency,
              ).length === 0 && (
                <div className="text-[11px] text-muted-foreground text-center py-1">
                  No billable projects this{" "}
                  {selectedView === "week" ? "week" : "month"}
                </div>
              )}
            </div>
          </HoverCardContent>
        </HoverCard>
      ))}
    </div>
  );
}
