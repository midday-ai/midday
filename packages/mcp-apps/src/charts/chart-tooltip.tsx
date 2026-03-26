import { formatAmount } from "@midday/utils/format";
import { commonChartConfig } from "../utils/chart-config";

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; name?: string }>;
  label?: string;
  currency?: string;
  locale?: string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  currency,
  locale,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const fmt = (v: number) => {
    if (!currency) return v.toLocaleString(locale);
    return (
      formatAmount({
        amount: v,
        currency,
        locale: locale ?? undefined,
        maximumFractionDigits: 0,
      }) ?? `${currency}${v.toLocaleString()}`
    );
  };

  return (
    <div
      className="border border-border px-2 py-1.5 text-[10px] bg-card text-foreground shadow-sm"
      style={{ fontFamily: commonChartConfig.fontFamily }}
    >
      <p className="mb-1 text-muted-foreground">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-foreground">
          {entry.name || entry.dataKey}: {fmt(entry.value)}
        </p>
      ))}
    </div>
  );
}
