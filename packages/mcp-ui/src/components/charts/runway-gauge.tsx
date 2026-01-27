"use client";

import { isDarkMode } from "@/utils/chart-config";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export interface RunwayGaugeProps {
  /** Number of months of runway */
  months: number;
  /** Maximum months to display (default 24) */
  maxMonths?: number;
  height?: number;
  className?: string;
}

/**
 * Runway gauge visualization showing months of runway remaining
 */
export function RunwayGauge({
  months,
  maxMonths = 24,
  height = 300,
  className = "",
}: RunwayGaugeProps) {
  const isDark = isDarkMode();

  // Determine status based on months
  let status: "danger" | "warning" | "success";
  let statusColor: string;
  let statusMessage: string;

  if (months <= 3) {
    status = "danger";
    statusColor = isDark ? "#f87171" : "#ef4444";
    statusMessage =
      "Critical: Less than 3 months of runway. Consider immediate action to extend runway.";
  } else if (months <= 6) {
    status = "warning";
    statusColor = isDark ? "#fbbf24" : "#f59e0b";
    statusMessage =
      "Attention: 3-6 months of runway remaining. Plan for fundraising or cost reduction.";
  } else if (months <= 12) {
    status = "warning";
    statusColor = isDark ? "#fbbf24" : "#f59e0b";
    statusMessage =
      "Moderate runway. Continue monitoring expenses and revenue growth.";
  } else {
    status = "success";
    statusColor = isDark ? "#4ade80" : "#22c55e";
    statusMessage =
      "Healthy runway. Focus on growth while maintaining financial discipline.";
  }

  // Calculate gauge value (capped at maxMonths for visualization)
  const gaugeValue = Math.min(months, maxMonths);
  const gaugePercentage = (gaugeValue / maxMonths) * 100;
  const bgColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)";

  const gaugeData = [
    { value: gaugePercentage, color: statusColor },
    { value: 100 - gaugePercentage, color: bgColor },
  ];

  return (
    <div className={`w-full text-center ${className}`}>
      <div
        className="relative mx-auto"
        style={{ width: 240, height: height * 0.5 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={gaugeData}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius="75%"
              outerRadius="100%"
              dataKey="value"
              stroke="none"
            >
              {gaugeData.map((entry, index) => (
                <Cell
                  key={`cell-${index.toString()}`}
                  fill={entry.color}
                  stroke="none"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center value */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
          <div className="text-5xl font-bold" style={{ color: statusColor }}>
            {months}
          </div>
          <div className="text-sm text-muted-foreground">months</div>
        </div>
      </div>

      {/* Status message */}
      <div
        className="mt-6 mx-auto max-w-sm p-3 rounded text-sm"
        style={{
          backgroundColor:
            status === "danger"
              ? "rgba(239, 68, 68, 0.1)"
              : status === "warning"
                ? "rgba(245, 158, 11, 0.1)"
                : "rgba(34, 197, 94, 0.1)",
          color: statusColor,
        }}
      >
        {statusMessage}
      </div>
    </div>
  );
}
