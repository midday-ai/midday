// @ts-nocheck
"use client";

import { useUserQuery } from "@/hooks/use-user";
import { formatAmount } from "@/utils/format";
import { Icons } from "@midday/ui/icons";
import { format } from "date-fns";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  commonChartConfig,
  createCompactTickFormatter,
  useChartMargin,
} from "./chart-utils";

const ToolTipContent = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) => {
  const { data: user } = useUserQuery();

  if (!active || !payload || payload.length === 0) return null;

  const current = payload[0]?.payload;

  if (!current) return null;

  // Format amounts using proper currency formatting
  const formatCurrency = (amount: number) =>
    formatAmount({
      amount,
      currency: current.currency,
      locale: user?.locale ?? undefined,
      maximumFractionDigits: 0,
    }) ?? `${current.currency}${amount.toLocaleString()}`;

  return (
    <div className="border p-2 text-[10px] font-hedvig-sans bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d] text-black dark:text-white shadow-sm">
      <p className="mb-1 text-[#707070] dark:text-[#666666]">{label}</p>
      <p className="text-black dark:text-white">
        Total: {formatCurrency(current.total)}
      </p>
      <p className="text-black dark:text-white">
        Recurring: {formatCurrency(current.recurring)}
      </p>
    </div>
  );
};

export function StackedBarChart({ data, height = 290 }) {
  const tickFormatter = createCompactTickFormatter();

  const formattedData = data.result.map((item) => ({
    ...item,
    value: item.value,
    recurring: item.recurring,
    total: item.total,
    meta: data.meta,
    date: format(new Date(item.date), "MMM"),
  }));

  // Calculate margin using the utility hook
  const { marginLeft } = useChartMargin(formattedData, "total", tickFormatter);

  return (
    <div className="w-full relative">
      <div className="space-x-4 absolute right-0 -top-10 hidden md:flex">
        <div className="flex space-x-2 items-center">
          <span className="w-2 h-2 rounded-full bg-[#C6C6C6] dark:bg-[#606060]" />
          <span className="text-sm text-[#606060]">Total expenses</span>
        </div>
        <div className="flex space-x-2 items-center">
          <Icons.DotRaster />
          <span className="text-sm text-[#606060]">Recurring</span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={formattedData}
            barGap={15}
            margin={{ top: 6, right: 6, left: -marginLeft, bottom: 6 }}
          >
            <defs>
              <pattern
                id="raster"
                patternUnits="userSpaceOnUse"
                width="64"
                height="64"
              >
                <rect
                  width="64"
                  height="64"
                  className="dark:fill-[#323232] fill-[#C6C6C6]"
                />
                <path
                  d="M-106 110L22 -18"
                  className="stroke-[#323232] dark:stroke-white"
                />
                <path
                  d="M-98 110L30 -18"
                  className="stroke-[#323232] dark:stroke-white"
                />
                <path
                  d="M-90 110L38 -18"
                  className="stroke-[#323232] dark:stroke-white"
                />
                <path
                  d="M-82 110L46 -18"
                  className="stroke-[#323232] dark:stroke-white"
                />
                <path
                  d="M-74 110L54 -18"
                  className="stroke-[#323232] dark:stroke-white"
                />
                <path
                  d="M-66 110L62 -18"
                  className="stroke-[#323232] dark:stroke-white"
                />
                <path
                  d="M-58 110L70 -18"
                  className="stroke-[#323232] dark:stroke-white"
                />
                <path
                  d="M-50 110L78 -18"
                  className="stroke-[#323232] dark:stroke-white"
                />
                <path
                  d="M-42 110L86 -18"
                  className="stroke-[#323232] dark:stroke-white"
                />
                <path
                  d="M-34 110L94 -18"
                  className="stroke-[#323232] dark:stroke-white"
                />
                <path
                  d="M-26 110L102 -18"
                  className="stroke-[#323232] dark:stroke-white"
                />
                <path
                  d="M-18 110L110 -18"
                  className="stroke-[#323232] dark:stroke-white"
                />
                <path
                  d="M-10 110L118 -18"
                  className="stroke-[#323232] dark:stroke-white"
                />
                <path
                  d="M-2 110L126 -18"
                  className="stroke-[#323232] dark:stroke-white"
                />
                <path
                  d="M6 110L134 -18"
                  className="stroke-[#323232] dark:stroke-white"
                />
                <path
                  d="M14 110L142 -18"
                  className="stroke-[#323232] dark:stroke-white"
                />
                <path
                  d="M22 110L150 -18"
                  className="stroke-[#323232] dark:stroke-white"
                />
              </pattern>
            </defs>

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "var(--chart-axis-text)",
                fontSize: 10,
                fontFamily: commonChartConfig.fontFamily,
              }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "var(--chart-axis-text)",
                fontSize: 10,
                fontFamily: commonChartConfig.fontFamily,
              }}
              tickFormatter={tickFormatter}
              dataKey="total"
            />

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--chart-grid-stroke)"
            />

            <Tooltip content={ToolTipContent} cursor={false} />

            <Bar
              barSize={16}
              dataKey="recurring"
              stackId="a"
              fill="url(#raster)"
            />

            <Bar
              barSize={16}
              dataKey="value"
              stackId="a"
              className="dark:fill-[#323232] fill-[#C6C6C6]"
            />

            <Line
              type="monotone"
              dataKey="recurring"
              strokeWidth={2.5}
              stroke="hsl(var(--border))"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
