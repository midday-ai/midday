"use client";

import type { MessageDataParts } from "@api/ai/tools/registry";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { formatAmount } from "@midday/utils/format";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChatCanvasProps {
  canvasData: MessageDataParts["data-canvas"][];
  canvasTitle?: string;
  className?: string;
  onClose?: () => void;
}

function renderCanvasContent(canvasData: MessageDataParts["data-canvas"]) {
  switch (canvasData.type) {
    case "chart":
      return (
        <GenericChart
          chartType={canvasData.chartType || "area"}
          title={canvasData.title}
          data={canvasData.data}
        />
      );
    default:
      return null;
  }
}

export function ChatCanvas({
  canvasData,
  canvasTitle,
  className,
  onClose,
}: ChatCanvasProps) {
  const latestData = useMemo(() => {
    return canvasData[canvasData.length - 1];
  }, [canvasData]);

  // Show loading state if we have a title but no data yet
  const isLoading = canvasTitle && (!latestData || canvasData.length === 0);

  if (!canvasTitle && (!latestData || canvasData.length === 0)) {
    return null;
  }

  return (
    <div className={cn("w-full bg-background", className)}>
      <div className="h-full overflow-y-auto">
        <div className="p-6">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-[16px] font-normal font-serif">
                {canvasTitle}
              </h2>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 hover:bg-muted rounded-md transition-colors"
                aria-label="Close canvas"
              >
                <Icons.Close className="h-4 w-4" />
              </button>
            )}
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">
                Processing analysis...
              </div>
            </div>
          ) : latestData ? (
            renderCanvasContent(latestData)
          ) : null}
        </div>
      </div>
    </div>
  );
}

function GenericChart({
  chartType = "area",
  title,
  data,
}: {
  chartType?: "area" | "bar" | "line" | "pie" | "donut";
  title?: string;
  data: any;
}) {
  const { total, currency, breakdown } = data;

  const renderChart = () => {
    switch (chartType) {
      case "area":
        return (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={breakdown}>
              <defs>
                <linearGradient
                  id="generic-gradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis hide />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="border bg-background p-3">
                        <div className="text-sm font-medium">{label}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatAmount({
                            amount: payload[0]?.value as number,
                            currency: currency || "USD",
                          })}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#generic-gradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      // Add other chart types as needed
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border p-6">
        <div className="text-2xl font-bold">
          {formatAmount({
            amount: total || 0,
            currency: currency || "USD",
          })}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {title || "Total Value"}
        </p>
      </div>

      {/* Chart */}
      <div className="bg-card border p-4">{renderChart()}</div>
    </div>
  );
}
