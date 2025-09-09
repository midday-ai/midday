"use client";

import type { MessageDataParts } from "@api/ai/tools/registry";
import { Badge } from "@midday/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
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
          chartType="area"
          title={canvasData.title}
          data={canvasData.breakdown}
        />
      );
    case "dashboard":
      return <GenericDashboard title={canvasData.title} data={canvasData} />;
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

  // Show loading state if we have a title but no data yet, or if data has loading metadata
  const isLoading = canvasTitle && (!latestData || canvasData.length === 0);
  const hasLoadingData = latestData?.dashboard?.cards?.some(
    (card) => card.metadata?.loading,
  );

  // Show canvas if we have ANY data OR a title (including loading state)
  if (canvasData.length === 0 && !canvasTitle) {
    return null;
  }

  return (
    <div className={cn("w-full bg-background h-full flex flex-col", className)}>
      <div className="flex-1 overflow-y-auto">
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
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="animate-spin h-4 w-4 border border-muted-foreground border-t-transparent rounded-full" />
                Processing analysis...
              </div>
            </div>
          ) : latestData ? (
            <div className="relative">
              {hasLoadingData && (
                <div className="absolute top-2 right-2 z-10">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-md">
                    <div className="animate-spin h-3 w-3 border border-muted-foreground border-t-transparent rounded-full" />
                    Updating...
                  </div>
                </div>
              )}
              {renderCanvasContent(latestData)}
            </div>
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
  // Extract CanvasData properties directly
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

function GenericDashboard({
  title,
  data,
}: {
  title?: string;
  data: any;
}) {
  // Extract CanvasData properties directly
  const { dashboard, breakdown, currency } = data;

  if (!dashboard) {
    return null;
  }

  const { cards, summary, chart, table } = dashboard;

  return (
    <div className="space-y-6">
      {/* Chart Section - First */}
      {(breakdown && breakdown.length > 0) ||
      (chart?.data && chart.data.length > 0) ? (
        <Card className="p-0 border-none">
          <CardContent>
            <ResponsiveContainer
              width="100%"
              height={chart?.config?.height || 320}
            >
              <AreaChart data={chart?.data || breakdown}>
                <defs>
                  <linearGradient
                    id="expense-gradient"
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
                      const pointData = payload[0]?.payload;
                      return (
                        <div className="border bg-background p-3 rounded-lg">
                          <div className="text-sm font-medium">{label}</div>
                          <div className="text-sm text-muted-foreground">
                            {pointData?.label ||
                              `Value: ${formatAmount({
                                amount: payload[0]?.value as number,
                                currency: currency || "USD",
                              })}`}
                          </div>
                          {pointData?.metadata && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {Object.entries(pointData.metadata).map(
                                ([key, value]) => (
                                  <div key={key}>
                                    {key}: {String(value)}
                                  </div>
                                ),
                              )}
                            </div>
                          )}
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
                  fill="url(#expense-gradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : null}

      {/* Table Section */}
      {table && (
        <Card className="p-0 border-none">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-lg">{table.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {table.columns.map((column) => (
                      <TableHead
                        key={column.key}
                        className={cn(
                          column.width,
                          column.align === "right"
                            ? "text-right"
                            : column.align === "center"
                              ? "text-center"
                              : "text-left",
                        )}
                      >
                        {column.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.data.map((row) => (
                    <TableRow key={row.id}>
                      {table.columns.map((column) => {
                        const value = row.data[column.key];
                        let displayValue = value;

                        // Format based on column type
                        if (column.type === "currency") {
                          displayValue = formatAmount({
                            amount: value,
                            currency:
                              column.format?.currency || currency || "USD",
                          });
                        } else if (column.type === "percentage") {
                          displayValue = `${value}%`;
                        } else if (column.type === "date") {
                          displayValue = value; // Already formatted in the data
                        }

                        return (
                          <TableCell
                            key={`${row.id}-${column.key}`}
                            className={cn(
                              column.align === "right"
                                ? "text-right"
                                : column.align === "center"
                                  ? "text-center"
                                  : "text-left",
                              column.type === "currency" ? "font-medium" : "",
                              column.type === "date"
                                ? "font-medium text-xs"
                                : "",
                              column.type === "percentage"
                                ? "text-xs text-muted-foreground"
                                : "",
                            )}
                          >
                            {column.key === "vendor" ? (
                              <div className="flex items-center gap-2">
                                <span className="truncate max-w-32">
                                  {displayValue}
                                </span>
                                {row.metadata?.recurring && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs px-1 py-0"
                                  >
                                    Recurring
                                  </Badge>
                                )}
                              </div>
                            ) : column.type === "text" &&
                              column.key === "category" ? (
                              <span className="text-xs text-muted-foreground">
                                {displayValue}
                              </span>
                            ) : (
                              displayValue
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {table.metadata?.totalTransactions && (
              <div className="mt-2 text-xs text-muted-foreground">
                Showing {table.data.length} of{" "}
                {table.metadata.totalTransactions} transactions
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dashboard Cards - Dynamic Grid */}
      <div
        className={`grid gap-4 ${dashboard.columns === 2 ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4"}`}
      >
        {cards?.map((card: any, index: number) => {
          const isLoading = card.metadata?.loading || card.metadata?.skeleton;

          return (
            <Card
              key={card.id || `card-${card.title}-${index}`}
              className="p-4"
            >
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </div>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-pulse bg-muted h-8 w-24 rounded" />
                      <div className="animate-spin h-4 w-4 border border-muted-foreground border-t-transparent rounded-full" />
                    </div>
                  ) : card.format === "currency" ? (
                    formatAmount({
                      amount: card.value,
                      currency: card.currency || currency || "USD",
                    })
                  ) : card.format === "percentage" ? (
                    `${card.value.toLocaleString()}%`
                  ) : card.format === "duration" ? (
                    `${card.value.toLocaleString()} ${card.currency}`
                  ) : (
                    `${card.value.toLocaleString()}${card.currency ? ` ${card.currency}` : ""}`
                  )}
                </div>
                {card.subtitle && (
                  <div className="text-xs text-muted-foreground">
                    {card.subtitle}
                  </div>
                )}
                {card.trend && (
                  <div className="flex items-center gap-1 text-xs">
                    <span
                      className={cn(
                        "flex items-center gap-1",
                        card.trend.direction === "up"
                          ? "text-red-600"
                          : card.trend.direction === "down"
                            ? "text-green-600"
                            : "text-muted-foreground",
                      )}
                    >
                      {card.trend.direction === "up"
                        ? "↗"
                        : card.trend.direction === "down"
                          ? "↘"
                          : "→"}
                      {card.trend.description}
                    </span>
                  </div>
                )}
                {card.status && (
                  <Badge
                    variant={
                      card.status.level === "good"
                        ? "default"
                        : card.status.level === "warning"
                          ? "secondary"
                          : card.status.level === "error"
                            ? "destructive"
                            : "outline"
                    }
                    className="text-xs"
                  >
                    {card.status.message}
                  </Badge>
                )}
                {card.metadata && (
                  <div className="text-xs text-muted-foreground">
                    {Object.entries(card.metadata).map(([key, value]) => (
                      <div key={key} className="truncate">
                        {key}: {String(value)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Summary Section */}
      {summary && (
        <Card className="p-0 border-none">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-lg">{summary.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-0">
            <p className="text-sm text-muted-foreground">
              {summary.description}
            </p>
            {summary.insights && summary.insights.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Key Insights:</h4>
                <ul className="space-y-1">
                  {summary.insights.map((insight: string, index: number) => (
                    <li
                      key={`insight-${insight.slice(0, 20)}-${index}`}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-primary mt-1">•</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {summary.recommendations && summary.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recommendations:</h4>
                <ul className="space-y-1">
                  {summary.recommendations.map((rec: string, index: number) => (
                    <li
                      key={`rec-${rec.slice(0, 20)}-${index}`}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-primary mt-1">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {summary.metadata && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Additional Information:</h4>
                <div className="text-xs text-muted-foreground">
                  {Object.entries(summary.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium">{key}:</span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
