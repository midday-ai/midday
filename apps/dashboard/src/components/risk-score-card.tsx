"use client";

import { RiskBadge } from "@/components/risk-badge";
import { useTRPC } from "@/trpc/client";
import { cn } from "@midday/ui/cn";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

type Props = {
  dealId: string;
};

const subScoreLabels: Record<string, string> = {
  consistency: "Payment Consistency",
  nsf: "NSF Severity",
  velocity: "Payment Velocity",
  recovery: "Recovery Behavior",
  progress: "Deal Progress",
  amounts: "Amount Accuracy",
};

function SubScoreBar({ label, value }: { label: string; value: number }) {
  const barColor =
    value <= 33
      ? "bg-[#00C969]"
      : value <= 66
        ? "bg-[#FFD02B]"
        : "bg-[#FF3638]";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#606060]">{label}</span>
        <span className="text-[11px] font-medium tabular-nums">
          {Math.round(value)}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

const eventTypeLabels: Record<string, { label: string; color: string }> = {
  on_time: { label: "On-time payment", color: "text-[#00C969]" },
  nsf: { label: "NSF / Returned", color: "text-[#FF3638]" },
  missed: { label: "Missed payment", color: "text-[#FF3638]" },
  partial: { label: "Partial payment", color: "text-[#FFD02B]" },
  overpayment: { label: "Overpayment", color: "text-[#00C969]" },
  recovery: { label: "Recovery payment", color: "text-[#1F6FEB]" },
};

export function RiskScoreCard({ dealId }: Props) {
  const trpc = useTRPC();

  const { data: score, isLoading: scoreLoading } = useQuery(
    trpc.risk.getScore.queryOptions({ dealId }),
  );

  const { data: events } = useQuery(
    trpc.risk.getEvents.queryOptions({ dealId, limit: 10 }),
  );

  if (scoreLoading) {
    return <div className="animate-pulse h-48 bg-muted rounded" />;
  }

  if (!score) {
    return (
      <div className="border border-border p-4">
        <div className="text-sm text-[#878787]">
          No risk score calculated yet. Record a payment to generate.
        </div>
      </div>
    );
  }

  const subScores = (score.subScores ?? {}) as Record<string, number>;

  return (
    <div className="border border-border bg-background p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Risk Score</h3>
        <RiskBadge
          score={Number(score.overallScore)}
          band={score.band as "low" | "medium" | "high"}
          previousScore={score.previousScore ? Number(score.previousScore) : null}
        />
      </div>

      {/* Sub-scores */}
      <div className="space-y-2">
        {Object.entries(subScoreLabels).map(([key, label]) => (
          <SubScoreBar
            key={key}
            label={label}
            value={subScores[key] ?? 50}
          />
        ))}
      </div>

      {/* Event Timeline */}
      {events && events.length > 0 && (
        <div className="pt-3 border-t border-border">
          <h4 className="text-[11px] font-medium text-[#878787] mb-2 uppercase tracking-wider">
            Recent Events
          </h4>
          <div className="space-y-2">
            {events.slice(0, 5).map((event) => {
              const typeInfo = eventTypeLabels[event.eventType] ?? {
                label: event.eventType,
                color: "text-[#606060]",
              };
              return (
                <div
                  key={event.id}
                  className="flex items-center justify-between text-[11px]"
                >
                  <span className={typeInfo.color}>{typeInfo.label}</span>
                  <span className="text-[#878787]">
                    {formatDistanceToNow(new Date(event.eventDate), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
