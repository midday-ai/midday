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
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-normal font-serif text-foreground m-0">
          {title}
        </h4>
        {legend && (
          <div className="flex gap-4 items-center">
            {legend.map((item) => (
              <div key={item.label} className="flex gap-2 items-center">
                <div
                  className="w-2 h-2"
                  style={{ background: getLegendBackground(item.type) }}
                />
                <span className="text-xs text-muted-foreground">
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
