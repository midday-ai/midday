"use client";

import { createCompactTickFormatter, useChartMargin } from "@/lib/chart-utils";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface QueueActivityData {
  time: string;
  completed: number;
  failed: number;
  active: number;
}

interface QueueActivityChartProps {
  data: QueueActivityData[];
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && Array.isArray(payload) && payload.length > 0) {
    const completed =
      payload.find((p) => p.dataKey === "completed")?.value || 0;
    const failed = payload.find((p) => p.dataKey === "failed")?.value || 0;
    const active = payload.find((p) => p.dataKey === "active")?.value || 0;

    return (
      <div className="p-2 text-[10px] font-sans border bg-white dark:bg-[#0c0c0c] border-gray-200 dark:border-[#1d1d1d] text-black dark:text-white shadow-sm">
        <p className="mb-1 text-gray-500 dark:text-[#666666]">{label}</p>
        <p className="text-black dark:text-white">Completed: {completed}</p>
        <p className="text-black dark:text-white">Failed: {failed}</p>
        <p className="text-black dark:text-white">Active: {active}</p>
      </div>
    );
  }
  return null;
};

export function QueueActivityChart({
  data,
  height = 320,
}: QueueActivityChartProps) {
  // Use the compact tick formatter
  const tickFormatter = createCompactTickFormatter();

  // Calculate max value across all data keys for margin calculation
  const maxValues = data.map((d) =>
    Math.max(d.completed || 0, d.failed || 0, d.active || 0),
  );
  const maxValue = Math.max(...maxValues, 0);

  // Create temporary data structure with max value for margin calculation
  const marginData = [{ maxValue }];
  const { marginLeft } = useChartMargin(marginData, "maxValue", tickFormatter);

  return (
    <div className="w-full">
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 6, right: 6, left: -marginLeft, bottom: 6 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1d1d1d" />
            <XAxis
              dataKey="time"
              tick={{ fill: "#666666", fontSize: 10 }}
              tickLine={{ stroke: "#1d1d1d" }}
              axisLine={{ stroke: "#1d1d1d" }}
            />
            <YAxis
              tick={{ fill: "#666666", fontSize: 10 }}
              tickLine={{ stroke: "#1d1d1d" }}
              axisLine={{ stroke: "#1d1d1d" }}
              tickFormatter={tickFormatter}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="completed" fill="#ffffff" name="Completed" />
            <Bar dataKey="failed" fill="#666666" name="Failed" />
            <Bar dataKey="active" fill="#333333" name="Active" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
