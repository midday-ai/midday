"use client";

import { useUserContext } from "@/store/user/hook";
import { formatAmount } from "@/utils/format";
import { format } from "date-fns";
import React from "react";
import {
  Area,
  AreaChart as BaseAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ToolTipContentProps = {
  payload: any;
};

const ToolTipContent = ({ payload }: ToolTipContentProps) => {
  const { value = 0, date, currency } = payload.at(0)?.payload ?? {};
  const { locale } = useUserContext((state) => state.data);

  return (
    <div className="w-[240px] border shadow-sm bg-background">
      <div className="py-2 px-3">
        <div className="flex items-center justify-between">
          <p className="font-medium text-[13px]">
            {formatAmount({
              maximumFractionDigits: 0,
              minimumFractionDigits: 0,
              currency,
              amount: value,
              locale,
            })}
          </p>
          <p className="text-xs text-[#606060] text-right">
            {date && format(new Date(date), "MMM, y")}
          </p>
        </div>
      </div>
    </div>
  );
};

type AreaChartProps = {
  data: any;
  height?: number;
};

export function AreaChart({ data, height = 290 }: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BaseAreaChart data={data}>
        <defs>
          <pattern
            id="raster"
            patternUnits="userSpaceOnUse"
            width="64"
            height="64"
          >
            <path d="M-106 110L22 -18" stroke="#282828" />
            <path d="M-98 110L30 -18" stroke="#282828" />
            <path d="M-90 110L38 -18" stroke="#282828" />
            <path d="M-82 110L46 -18" stroke="#282828" />
            <path d="M-74 110L54 -18" stroke="#282828" />
            <path d="M-66 110L62 -18" stroke="#282828" />
            <path d="M-58 110L70 -18" stroke="#282828" />
            <path d="M-50 110L78 -18" stroke="#282828" />
            <path d="M-42 110L86 -18" stroke="#282828" />
            <path d="M-34 110L94 -18" stroke="#282828" />
            <path d="M-26 110L102 -18" stroke="#282828" />
            <path d="M-18 110L110 -18" stroke="#282828" />
            <path d="M-10 110L118 -18" stroke="#282828" />
            <path d="M-2 110L126 -18" stroke="#282828" />
            <path d="M6 110L134 -18" stroke="#282828" />
            <path d="M14 110L142 -18" stroke="#282828" />
            <path d="M22 110L150 -18" stroke="#282828" />
          </pattern>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          className="stoke-[#DCDAD2] dark:stroke-[#2C2C2C]"
        />

        <Tooltip
          content={(content) => <ToolTipContent {...content} />}
          cursor={false}
        />

        <XAxis
          dataKey="date"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickMargin={15}
          tickFormatter={(value) => {
            return format(new Date(value), "MMM");
          }}
          tick={{
            fill: "#606060",
            fontSize: 12,
            fontFamily: "var(--font-sans)",
          }}
        />

        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tick={{
            fill: "#606060",
            fontSize: 12,
            fontFamily: "var(--font-sans)",
          }}
        />

        <Tooltip />

        <Area
          strokeWidth={2.5}
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--primary))"
          fill="url(#raster)"
        />
      </BaseAreaChart>
    </ResponsiveContainer>
  );
}
