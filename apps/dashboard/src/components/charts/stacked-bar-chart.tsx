"use client";

import { useI18n } from "@/locales/client";
import { useUserContext } from "@/store/user/hook";
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

const ToolTipContent = ({ payload = [] }) => {
  const t = useI18n();
  const { locale } = useUserContext((state) => state.data);

  const current = payload[0]?.payload;

  if (!current) return null;

  return (
    <div className="w-[240px] border shadow-sm bg-background">
      <div className="border-b-[1px] px-4 py-2 flex justify-between items-center">
        <p className="text-sm">{t(`chart_type.${current.meta.type}`)}</p>
      </div>

      <div className="p-4">
        <div className="flex justify-between mb-2">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-[8px] h-[8px] rounded-full bg-[#C6C6C6] dark:bg-[#606060]" />
            <p className="font-medium text-[13px]">
              {formatAmount({
                maximumFractionDigits: 0,
                minimumFractionDigits: 0,
                currency: current.currency,
                amount: current.total,
                locale,
              })}
            </p>
          </div>

          <p className="text-xs text-[#606060] text-right">Total</p>
        </div>

        <div className="flex justify-between">
          <div className="flex items-center justify-center space-x-2">
            <Icons.DotRaster />
            <p className="font-medium text-[13px]">
              {formatAmount({
                amount: current.recurring,
                currency: current.currency,
                maximumFractionDigits: 0,
                minimumFractionDigits: 0,
                locale,
              })}
            </p>
          </div>

          <p className="text-xs text-[#606060] text-right">Recurring</p>
        </div>
      </div>
    </div>
  );
};

export function StackedBarChart({ data, height = 290 }) {
  const formattedData = data.result.map((item) => ({
    ...item,
    value: item.value,
    recurring: item.recurring,
    total: item.total,
    meta: data.meta,
    date: format(new Date(item.date), "MMM"),
  }));

  return (
    <div className="relative h-full w-full">
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

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={formattedData} barGap={15}>
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
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickMargin={15}
            tick={{
              fill: "#606060",
              fontSize: 12,
              fontFamily: "var(--font-sans)",
            }}
          />

          <YAxis
            stroke="#888888"
            fontSize={12}
            tickMargin={10}
            tickLine={false}
            axisLine={false}
            tick={{
              fill: "#606060",
              fontSize: 12,
              fontFamily: "var(--font-sans)",
            }}
          />

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            className="stoke-[#DCDAD2] dark:stroke-[#2C2C2C]"
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
  );
}
