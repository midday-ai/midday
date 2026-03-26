import type { ReactNode } from "react";

interface LegendItem {
  label: string;
  type: "solid" | "dashed" | "pattern";
}

interface ChartContainerProps {
  title: string;
  legend?: LegendItem[];
  children?: ReactNode;
}

function getLegendBackground(type: LegendItem["type"]): string {
  switch (type) {
    case "solid":
      return "var(--chart-bar-fill)";
    case "pattern":
      return "repeating-linear-gradient(45deg, #666 0, #666 1px, transparent 1px, transparent 2px)";
    case "dashed":
      return "#666";
  }
}

export function ChartContainer({
  title,
  legend,
  children,
}: ChartContainerProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h4
          style={{
            fontSize: 18,
            fontWeight: 400,
            fontFamily: "var(--font-serif)",
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          {title}
        </h4>
        {legend && (
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            {legend.map((item) => (
              <div
                key={item.label}
                style={{ display: "flex", gap: 8, alignItems: "center" }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    background: getLegendBackground(item.type),
                    borderRadius: 0,
                  }}
                />
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
