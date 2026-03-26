import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatAmount } from "../utils/format-amount";

interface DonutDataItem {
  name: string;
  value: number;
  percentage?: number;
}

interface DonutChartProps {
  data: DonutDataItem[];
  height?: number;
  currency?: string;
  locale?: string;
}

const GRAY_SHADES = [
  "hsl(var(--foreground))",
  "#707070",
  "#A0A0A0",
  "#606060",
  "#404040",
  "#303030",
  "#202020",
];

function DonutTooltip({
  active,
  payload,
  currency,
  locale,
}: {
  active?: boolean;
  payload?: any[];
  currency?: string;
  locale?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="border border-border px-2 py-1.5 text-[10px] bg-card text-foreground shadow-sm">
      <p className="mb-1 text-muted-foreground">{d.name}</p>
      <p className="text-foreground">
        {currency
          ? (formatAmount({ amount: d.value, currency, locale }) ?? d.value)
          : d.value.toLocaleString(locale)}
      </p>
      {d.percentage != null && (
        <p className="text-muted-foreground">{d.percentage.toFixed(1)}%</p>
      )}
    </div>
  );
}

export function GenericDonutChart({
  data,
  height = 320,
  currency,
  locale,
}: DonutChartProps) {
  const chartData = data.map((item, i) => ({
    ...item,
    color: GRAY_SHADES[i % GRAY_SHADES.length],
  }));

  return (
    <div
      className="relative"
      style={{
        height,
        backgroundImage:
          "radial-gradient(circle, var(--chart-axis-text) 1px, transparent 1px)",
        backgroundSize: "12px 12px",
      }}
    >
      <ResponsiveContainer width="100%" height="100%" debounce={1}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            fill="hsl(var(--foreground))"
            dataKey="value"
            paddingAngle={1}
            stroke="none"
          >
            {chartData.map((entry) => (
              <Cell
                key={`cell-${entry.name}`}
                fill={entry.color}
                stroke="none"
              />
            ))}
          </Pie>
          <Tooltip
            content={(props: any) => (
              <DonutTooltip {...props} currency={currency} locale={locale} />
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
