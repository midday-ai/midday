"use client";

import { cn } from "@midday/ui/cn";
import type { RouterOutputs } from "@api/trpc/routers/_app";

type CaseData = NonNullable<RouterOutputs["collections"]["getById"]>;

type Props = {
  data: CaseData;
};

function SlaBar({
  label,
  value,
  unit,
  status,
}: {
  label: string;
  value: number;
  unit: string;
  status: "green" | "yellow" | "red";
}) {
  const statusColors = {
    green: "bg-[#16a34a]",
    yellow: "bg-[#d97706]",
    red: "bg-[#dc2626]",
  };

  const statusText = {
    green: "text-[#16a34a]",
    yellow: "text-[#d97706]",
    red: "text-[#dc2626]",
  };

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] text-[#606060]">{label}</span>
        <span className={cn("text-sm font-mono font-medium", statusText[status])}>
          {value} {unit}
        </span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", statusColors[status])}
          style={{ width: `${Math.min((value / Math.max(value * 1.5, 30)) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function CaseSlaIndicators({ data }: Props) {
  const daysInStage = data.daysInStage ?? 0;
  const daysInCollections = data.daysInCollections ?? 0;

  // Simple threshold-based coloring
  const stageStatus: "green" | "yellow" | "red" =
    daysInStage > 14 ? "red" : daysInStage > 7 ? "yellow" : "green";
  const totalStatus: "green" | "yellow" | "red" =
    daysInCollections > 60 ? "red" : daysInCollections > 30 ? "yellow" : "green";

  return (
    <div className="border border-border bg-background p-4">
      <h3 className="text-sm font-medium mb-2">SLA Indicators</h3>

      <div className="divide-y divide-border">
        <SlaBar
          label="Time in Current Stage"
          value={daysInStage}
          unit="days"
          status={stageStatus}
        />
        <SlaBar
          label="Total Resolution Time"
          value={daysInCollections}
          unit="days"
          status={totalStatus}
        />
      </div>

      {data.nextFollowUp && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#606060]">Next Follow-up</span>
            <span
              className={cn(
                "text-sm font-medium",
                new Date(data.nextFollowUp) < new Date()
                  ? "text-[#dc2626]"
                  : "text-[#606060]",
              )}
            >
              {new Date(data.nextFollowUp).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
