"use client";

import { useCurrentLocale } from "@/locales/client";
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
import { getYAxisWidth, roundToNearestFactor } from "./utils";

const ToolTipContent = ({ payload, currency }) => {
  const { value = 0, date } = payload.at(0)?.payload ?? {};

  const locale = useCurrentLocale();

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

export function AreaChart({ currency, data, height = 290 }) {
  const locale = useCurrentLocale();

  const getLabel = (value: number) => {
    return formatAmount({
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
      currency,
      amount: value,
      locale,
    });
  };

  // TODO: Get highest value used in yAxis
  const getLabelMaxValue = getLabel(
    roundToNearestFactor(data?.map(({ value }) => value))
  );

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
            <path d="M-99 97L21 -23" stroke="#282828" />
            <path d="M-91 97L29 -23" stroke="#282828" />
            <path d="M-83 97L37 -23" stroke="#282828" />
            <path d="M-75 97L45 -23" stroke="#282828" />
            <path d="M-67 97L53 -23" stroke="#282828" />
            <path d="M-59 97L61 -23" stroke="#282828" />
            <path d="M-51 97L69 -23" stroke="#282828" />
            <path d="M-43 97L77 -23" stroke="#282828" />
            <path d="M-35 97L85 -23" stroke="#282828" />
            <path d="M-27 97L93 -23" stroke="#282828" />
            <path d="M-19 97L101 -23" stroke="#282828" />
            <path d="M-11 97L109 -23" stroke="#282828" />
            <path d="M-3 97L117 -23" stroke="#282828" />
            <path d="M5 97L125 -23" stroke="#282828" />
            <path d="M13 97L133 -23" stroke="#282828" />
            <path d="M21 97L141 -23" stroke="#282828" />
          </pattern>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          className="stoke-[#DCDAD2] dark:stroke-[#2C2C2C]"
        />

        <Tooltip
          content={(content) => (
            <ToolTipContent {...content} currency={currency} />
          )}
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
          tickFormatter={getLabel}
          width={getYAxisWidth(getLabelMaxValue)}
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
