"use client";

import { formatAmount } from "@/utils/format";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
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
import { SelectableChartWrapper } from "./selectable-chart-wrapper";

interface RtrAgingData {
  month: string;
  "0-30": number;
  "31-60": number;
  "61-90": number;
  "90+": number;
}

interface RtrAgingChartProps {
  data: RtrAgingData[];
  height?: number;
  currency?: string;
  locale?: string;
  enableSelection?: boolean;
  onSelectionStateChange?: (isSelecting: boolean) => void;
  onSelectionComplete?: (
    startDate: string,
    endDate: string,
    chartType: string,
  ) => void;
}

const BUCKET_COLORS = {
  "0-30": "#0ea5e9",
  "31-60": "#d97706",
  "61-90": "#f97316",
  "90+": "#dc2626",
} as const;

const BUCKET_LABELS: Record<string, string> = {
  "0-30": "0-30 Days",
  "31-60": "31-60 Days",
  "61-90": "61-90 Days",
  "90+": "90+ Days",
};

const CustomTooltip = ({
  active,
  payload,
  label,
  currency = "USD",
  locale,
}: any) => {
  if (active && Array.isArray(payload) && payload.length > 0) {
    const formatCurrency = (amount: number) =>
      formatAmount({
        amount,
        currency,
        locale: locale ?? undefined,
        maximumFractionDigits: 0,
      }) ?? `${currency}${amount.toLocaleString()}`;

    return (
      <div className="border p-2 text-[10px] font-hedvig-sans bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d] text-black dark:text-white shadow-sm">
        <p className="mb-1 text-[#707070] dark:text-[#666666]">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.dataKey} className="text-black dark:text-white">
            {BUCKET_LABELS[entry.dataKey] ?? entry.dataKey}:{" "}
            {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function RtrAgingChart({
  data,
  height = 320,
  currency = "USD",
  locale,
  enableSelection = false,
  onSelectionStateChange,
  onSelectionComplete,
}: RtrAgingChartProps) {
  const tickFormatter = createCompactTickFormatter();

  // Calculate total for margin computation
  const dataWithTotal = data.map((d) => ({
    ...d,
    total: d["0-30"] + d["31-60"] + d["61-90"] + d["90+"],
  }));
  const { marginLeft } = useChartMargin(dataWithTotal, "total", tickFormatter);

  const chartContent = (
    <div className="w-full">
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 6, right: 6, left: -marginLeft, bottom: 6 }}
          >
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
            />
            <Tooltip
              content={<CustomTooltip currency={currency} locale={locale} />}
              wrapperStyle={{ zIndex: 9999 }}
            />
            <Bar
              dataKey="0-30"
              stackId="aging"
              fill={BUCKET_COLORS["0-30"]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="31-60"
              stackId="aging"
              fill={BUCKET_COLORS["31-60"]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="61-90"
              stackId="aging"
              fill={BUCKET_COLORS["61-90"]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="90+"
              stackId="aging"
              fill={BUCKET_COLORS["90+"]}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <SelectableChartWrapper
      data={data}
      dateKey="month"
      enableSelection={enableSelection}
      onSelectionComplete={(startDate, endDate) => {
        onSelectionComplete?.(startDate, endDate, "rtr-aging");
      }}
      onSelectionStateChange={onSelectionStateChange}
      chartType="rtr-aging"
    >
      {chartContent}
    </SelectableChartWrapper>
  );
}
