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
    <div className="w-[240px] rounded-lg border shadow-sm bg-background">
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

export function AreaChart({ currency, data }) {
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
    roundToNearestFactor(data.map(({ value }) => value))
  );

  return (
    <ResponsiveContainer width="100%" height={290}>
      <BaseAreaChart data={data}>
        <defs>
          <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="hsl(var(--primary))"
              stopOpacity={0.4}
            />
            <stop offset="95%" stopColor="transparent" stopOpacity={0} />
          </linearGradient>
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
          fill="url(#colorPv)"
        />
      </BaseAreaChart>
    </ResponsiveContainer>
  );
}
