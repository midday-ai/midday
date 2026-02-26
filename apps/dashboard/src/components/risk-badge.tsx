"use client";

import { cn } from "@midday/ui/cn";

type Props = {
  score: number;
  band: "low" | "medium" | "high";
  previousScore?: number | null;
  compact?: boolean;
  className?: string;
};

const bandStyles = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

const bandLabels = {
  low: "Low",
  medium: "Med",
  high: "High",
};

function getTrendArrow(
  current: number,
  previous: number | null | undefined,
): string {
  if (previous == null) return "";
  const diff = current - previous;
  if (diff < -2) return " \u2193"; // ↓ improving (score going down = less risk)
  if (diff > 2) return " \u2191"; // ↑ worsening
  return " \u2192"; // → stable
}

export function RiskBadge({
  score,
  band,
  previousScore,
  compact,
  className,
}: Props) {
  const trend = getTrendArrow(score, previousScore);

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
          bandStyles[band],
          className,
        )}
      >
        {Math.round(score)}
        {trend}
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "inline-flex items-center px-2.5 py-1 rounded text-sm font-medium",
          bandStyles[band],
        )}
      >
        {bandLabels[band]} Risk
      </span>
      <span className="text-sm font-medium tabular-nums">
        {Math.round(score)}/100
      </span>
      {trend && (
        <span
          className={cn(
            "text-xs",
            trend.includes("\u2193")
              ? "text-emerald-600"
              : trend.includes("\u2191")
                ? "text-red-600"
                : "text-[#878787]",
          )}
        >
          {trend.trim()}
        </span>
      )}
    </div>
  );
}
