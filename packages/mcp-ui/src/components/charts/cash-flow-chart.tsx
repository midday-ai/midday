"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatCompact } from "@/utils/format";
import {
  commonChartConfig,
  calculateChartMargin,
  getZeroInclusiveDomain,
} from "@/utils/chart-config";
import { InlineLegend } from "@/components/base";

export interface CashFlowData {
  month: string;
  date?: string;
  income: number;
  expenses: number;
  netCashFlow: number;
}

export interface CashFlowSummary {
  netCashFlow: number;
  totalIncome: number;
  totalExpenses: number;
  averageMonthlyCashFlow: number;
  currency: string;
}

export interface CashFlowChartProps {
  data: CashFlowData[];
  summary?: CashFlowSummary;
  currency?: string;
  height?: number;
  className?: string;
  showCumulative?: boolean;
}

/**
 * Cash flow bar chart showing income vs expenses
 */
export function CashFlowChart({
  data,
  summary,
  currency,
  height = 320,
  className = "",
  showCumulative = false,
}: CashFlowChartProps) {
  const effectiveCurrency = currency || summary?.currency || "USD";

  // Calculate cumulative if needed
  let cumulative = 0;
  const chartData = data.map((item) => {
    cumulative += item.netCashFlow;
    return {
      ...item,
      inflow: item.income,
      outflow: Math.abs(item.expenses),
      netFlow: item.netCashFlow,
      cumulativeFlow: cumulative,
    };
  });

  const tickFormatter = (value: number) => formatCompact(value);
  
  // Calculate margin based on max values
  const maxValues = chartData.map((d) => ({
    maxValue: Math.max(
      Math.abs(d.inflow),
      Math.abs(d.outflow),
      Math.abs(d.netFlow),
      Math.abs(d.cumulativeFlow),
    ),
  }));
  const { marginLeft } = calculateChartMargin(maxValues, "maxValue", tickFormatter);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="chart-tooltip-label">{label}</p>
          {payload.map((entry: any, index: number) => {
            const value = typeof entry.value === "number" ? entry.value : 0;
            const name =
              entry.dataKey === "inflow"
                ? "Cash Inflow"
                : entry.dataKey === "outflow"
                  ? "Cash Outflow"
                  : entry.dataKey === "netFlow"
                    ? "Net Flow"
                    : "Cumulative Flow";
            return (
              <p key={`${entry.dataKey}-${index}`} className="chart-tooltip-value">
                {name}: {formatCurrency(value, effectiveCurrency)}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 border border-border rounded">
            <div className="text-[11px] text-muted-foreground mb-1">
              Total Income
            </div>
            <div className="text-lg font-semibold text-green-500">
              {formatCurrency(summary.totalIncome, effectiveCurrency)}
            </div>
          </div>
          <div className="p-3 border border-border rounded">
            <div className="text-[11px] text-muted-foreground mb-1">
              Total Expenses
            </div>
            <div className="text-lg font-semibold text-red-500">
              {formatCurrency(Math.abs(summary.totalExpenses), effectiveCurrency)}
            </div>
          </div>
          <div className="p-3 border border-border rounded">
            <div className="text-[11px] text-muted-foreground mb-1">
              Net Cash Flow
            </div>
            <div
              className={`text-lg font-semibold ${
                summary.netCashFlow >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {formatCurrency(summary.netCashFlow, effectiveCurrency)}
            </div>
          </div>
        </div>
      )}

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 6, right: 6, left: -marginLeft, bottom: 6 }}
          >
            <defs>
              <pattern
                id="outflowPattern"
                x="0"
                y="0"
                width="8"
                height="8"
                patternUnits="userSpaceOnUse"
              >
                <rect width="8" height="8" fill="var(--chart-pattern-bg)" />
                <path
                  d="M0,0 L8,8 M-2,6 L6,16 M-4,4 L4,12"
                  stroke="var(--chart-pattern-stroke)"
                  strokeWidth="0.8"
                  opacity="0.6"
                />
              </pattern>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--chart-grid-stroke)"
            />
            <XAxis
              dataKey="month"
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
              domain={getZeroInclusiveDomain()}
            />
            <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 9999 }} />

            {/* Income bars */}
            <Bar dataKey="inflow" fill="var(--chart-bar-fill)" isAnimationActive={false} />
            {/* Expenses bars with pattern */}
            <Bar dataKey="outflow" fill="url(#outflowPattern)" isAnimationActive={false} />
            {/* Net flow bars */}
            <Bar dataKey="netFlow" fill="var(--chart-actual-line)" isAnimationActive={false} />

            {showCumulative && (
              <Line
                type="monotone"
                dataKey="cumulativeFlow"
                stroke="var(--chart-line-secondary)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={false}
              />
            )}

            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="2 2" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <InlineLegend
        items={[
          { label: "Income", type: "solid" },
          { label: "Expenses", type: "pattern" },
          { label: "Net Flow", type: "solid" },
          ...(showCumulative ? [{ label: "Cumulative", type: "dashed" as const }] : []),
        ]}
      />
    </div>
  );
}
