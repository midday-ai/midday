"use client";

import { formatAmount } from "@/utils/format";
import { Icons } from "@midday/ui/icons";
import { format } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Status } from "./status";

const ToolTipContent = ({ payload = {} }) => {
  const [current, previous] = payload;

  return (
    <div className="w-[240px] rounded-xl border shadow-sm bg-background">
      <div className="border-b-[1px] px-4 py-2 flex justify-between items-center">
        <p className="text-sm">Revenue</p>
        <div>
          <Status
            value={`${current?.payload.precentage.value}%`}
            variant={current?.payload.precentage.status}
          />
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between mb-2">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-[8px] h-[8px] rounded-full bg-[#F5F5F3]" />
            <p className="font-medium text-[13px]">
              {formatAmount({
                maximumFractionDigits: 0,
                minimumFractionDigits: 0,
                currency: "SEK",
                amount: current?.payload?.current.value || 0,
              })}
            </p>
          </div>

          <p className="text-xs text-[#606060] text-right">
            {current?.payload?.current.date &&
              format(new Date(current.payload.current.date), "MMM, Y")}
          </p>
        </div>

        <div className="flex justify-between">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-[8px] h-[8px] rounded-full bg-[#606060]" />
            <p className="font-medium text-[13px]">
              {formatAmount({
                amount: previous?.payload?.previous.value || 0,
                currency: "SEK",
                maximumFractionDigits: 0,
                minimumFractionDigits: 0,
              })}
            </p>
          </div>

          <p className="text-xs text-[#606060] text-right">
            {previous?.payload?.previous.date &&
              format(new Date(previous.payload.previous.date), "MMM, Y")}
          </p>
        </div>
      </div>
    </div>
  );
};

export function Chart({ data }) {
  const formattedData = data.map((item) => ({
    ...item,
    date: format(new Date(item.date), "MMM"),
  }));

  return (
    <div className="relative">
      <div className="flex space-x-4 absolute right-0 -top-10">
        <div className="flex space-x-2 items-center">
          <span className="w-2 h-2 rounded-full bg-[#F5F5F3]" />
          <span className="text-sm text-[#606060]">Chosen Period</span>
        </div>
        <div className="flex space-x-2 items-center">
          <span className="w-2 h-2 rounded-full bg-[#606060]" />
          <span className="text-sm text-[#606060]">Last Period</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={290}>
        <BarChart
          data={formattedData}
          margin={{ top: 0, left: 40, right: 0, bottom: 0 }}
          barGap={15}
          {...{
            overflow: "visible",
          }}
        >
          <XAxis
            dataKey="date"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tick={{
              fill: "#606060",
              fontSize: 14,
              fontFamily: "var(--font-sans)",
            }}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              formatAmount({
                maximumFractionDigits: 0,
                minimumFractionDigits: 0,
                currency: "SEK",
                amount: value,
              })
            }
            tick={{
              fill: "#606060",
              fontSize: 12,
              fontFamily: "var(--font-sans)",
            }}
          />
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#2C2C2C"
          />
          <Tooltip content={ToolTipContent} cursor={false} />

          <Bar dataKey="previous.value" barSize={14}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.previous.value > 0 ? "#323232" : "#FF3638"}
              />
            ))}
          </Bar>

          <Bar dataKey="current.value" barSize={14}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.current.value > 0 ? "#F5F5F3" : "#FF3638"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
