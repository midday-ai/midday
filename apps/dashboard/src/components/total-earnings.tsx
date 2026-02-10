"use client";

import type { BillableHoursResult } from "@midday/db/queries";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@midday/ui/hover-card";
import { secondsToHoursAndMinutes } from "@/utils/format";
import { FormatAmount } from "./format-amount";

type Props = {
  selectedView: "week" | "month";
  billableHoursData?: BillableHoursResult;
};

export function TotalEarnings({ selectedView, billableHoursData }: Props) {
  const earningsByCurrency = billableHoursData?.earningsByCurrency || {};
  const projectBreakdown = billableHoursData?.projectBreakdown || [];

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
                      <div className="text-right">
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
