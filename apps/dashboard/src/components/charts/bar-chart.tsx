"use client";

import { useCurrentLocale, useI18n } from "@/locales/client";
import { formatAmount } from "@/utils/format";
import { cn } from "@midday/ui/cn";
import { format } from "date-fns";
import {
  Bar,
  BarChart as BaseBarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Status } from "./status";
import { findLargestValue, getYAxisWidth } from "./utils";

// Override console.error
// This is a hack to suppress the warning about missing defaultProps in recharts library as of version 2.12
// @link https://github.com/recharts/recharts/issues/3615
const error = console.error;
console.error = (...args: any) => {
  if (/defaultProps/.test(args[0])) return;
  error(...args);
};

const ToolTipContent = ({ payload = {} }) => {
  const t = useI18n();
  const locale = useCurrentLocale();
  const [current, previous] = payload;

  return (
    <div className="w-[240px] rounded-lg border shadow-sm bg-background">
      <div className="border-b-[1px] px-4 py-2 flex justify-between items-center">
        <p className="text-sm">
          {t(`chart_type.${current?.payload?.meta?.type}`)}
        </p>
        <div>
          {current?.payload.precentage.value > 0 && (
            <Status
              value={`${current?.payload.precentage.value}%`}
              variant={current?.payload.precentage.status}
            />
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between mb-2">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-[8px] h-[8px] rounded-full bg-[#121212] dark:bg-[#F5F5F3]" />
            <p className="font-medium text-[13px]">
              {formatAmount({
                maximumFractionDigits: 0,
                minimumFractionDigits: 0,
                currency: current?.payload?.current.currency,
                amount: current?.payload?.current.value || 0,
                locale,
              })}
            </p>
          </div>

          <p className="text-xs text-[#606060] text-right">
            {current?.payload?.meta?.period === "weekly"
              ? current?.payload?.current?.date &&
                `Week ${format(
                  new Date(current.payload.current.date),
                  "ww, y"
                )}`
              : current?.payload?.current?.date &&
                format(new Date(current.payload.current.date), "MMM, y")}
          </p>
        </div>

        <div className="flex justify-between">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-[8px] h-[8px] rounded-full bg-[#C6C6C6] dark:bg-[#606060]" />
            <p className="font-medium text-[13px]">
              {formatAmount({
                amount: previous?.payload?.previous.value || 0,
                currency: previous?.payload?.current.currency,
                maximumFractionDigits: 0,
                minimumFractionDigits: 0,
                locale,
              })}
            </p>
          </div>

          <p className="text-xs text-[#606060] text-right">
            {previous?.payload?.meta?.period === "weekly"
              ? previous?.payload?.previous?.date &&
                `Week ${format(
                  new Date(previous.payload.previous.date),
                  "ww, y"
                )}`
              : previous?.payload?.previous?.date &&
                format(new Date(previous.payload.previous.date), "MMM, y")}
          </p>
        </div>
      </div>
    </div>
  );
};

export function BarChart({ data, disabled, currency }) {
  const locale = useCurrentLocale();

  const formattedData = data.result.map((item) => ({
    ...item,
    meta: data.meta,
    date: format(
      new Date(item.date),
      data.meta.period === "weekly" ? "w" : "MMM"
    ),
  }));

  const maxValue = Math.max(
    ...data.result.map((item) =>
      Math.max(item.current.value, item.previous.value)
    )
  );

  const getLabel = (value: number) => {
    return formatAmount({
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
      currency,
      amount: value,
      locale,
    });
  };

  return (
    <div className="relative">
      <div className="space-x-4 absolute right-0 -top-10 hidden md:flex">
        <div className="flex space-x-2 items-center">
          <span className="w-2 h-2 rounded-full bg-[#121212] dark:bg-[#F5F5F3]" />
          <span className="text-sm text-[#606060]">Current Period</span>
        </div>
        <div className="flex space-x-2 items-center">
          <span className="w-2 h-2 rounded-full bg-[#C6C6C6] dark:bg-[#606060]" />
          <span className="text-sm text-[#606060]">Last Period</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={290}>
        <BaseBarChart data={formattedData} barGap={15}>
          <XAxis
            dataKey="date"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickMargin={20}
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
            tickFormatter={(value) => getLabel(disabled ? 0 : value)}
            width={getYAxisWidth(maxValue)}
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

          <Bar dataKey="previous.value" barSize={16}>
            {data.result.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                className={cn(
                  "fill-[#41191A]",
                  +entry.previous.value > 0 &&
                    "dark:fill-[#323232] fill-[#C6C6C6]"
                )}
              />
            ))}
          </Bar>

          <Bar dataKey="current.value" barSize={16}>
            {data.result.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                className={cn(
                  "fill-[#FF3638]",
                  +entry.current.value > 0 &&
                    "dark:fill-[#F5F5F3] fill-[#121212]"
                )}
              />
            ))}
          </Bar>
        </BaseBarChart>
      </ResponsiveContainer>
    </div>
  );
}
