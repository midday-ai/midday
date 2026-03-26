import { commonChartConfig } from "../utils/chart-config";
import { formatAmount } from "../utils/format-amount";

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
      style={{
        border: "1px solid var(--border-color)",
        padding: "6px 8px",
        fontSize: 10,
        background: "var(--bg-card)",
        color: "var(--text-primary)",
        fontFamily: commonChartConfig.fontFamily,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <p style={{ marginBottom: 4, color: "var(--text-muted)" }}>{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: "var(--text-primary)" }}>
          {entry.name || entry.dataKey}: {fmt(entry.value)}
        </p>
      ))}
    </div>
  );
}
